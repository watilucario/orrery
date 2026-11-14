#!/usr/bin/env python3
"""Assemble l'app en un seul fichier HTML.

dist/index.html       : la page publiée comme artefact claude.ai (sans doctype : l'outil Artifact ajoute le squelette)
dist/standalone.html  : la même page, ouvrable directement dans un navigateur (tests, usage hors ligne)
dist/iphone.html      : la même page pour l'app iPhone (v12, ios/), plein écran ; jamais en ligne (supports des cours)

Le contenu vient de univers/ : un dossier par programme (programme.json donne l'ordre des matières),
un dossier par matière (recette.json, qcm/<thème>.md, cas.md, exercices.md, simulation.md, regles.md,
calcul.js, ids.lock). Format détaillé dans univers/README.md. L'assemblage contrôle le contenu et
s'arrête au moindre problème : il vaut mieux une erreur ici qu'une question cassée dans l'app.

Les fichiers de src/js/ sont des fragments concaténés dans l'ordre de leur numéro, dans une seule fonction
(function(){"use strict"; ... })() : ils partagent leurs variables. Ce ne sont pas des modules.
Le contenu des matières est placé avant eux (variables RECETTES, UNIVERS et CALCULS).

Options : --univers <dossier> (autre dossier de contenu, pour les tests), --dist <dossier>,
          --sans-verrou (ne met pas à jour ids.lock : contrôle seulement).
          --depaqueter <pack.md> <dossier> (v7) : range un pack de cours (une matière en un seul texte, fait par une
          IA avec docs/modele-de-pack.md) en fichiers lisibles dans <dossier>, à ajouter ensuite à programme.json.
          --empreintes <dossier> (v7.4) : l'empreinte de chaque fiche de la matière, à reporter dans sa revue.md.
Sans --univers ni --dist, assemble aussi le moteur seul (modeles/moteur, aucun contenu) dans dist/moteur/, avec
dist/moteur/site/index.html : le dossier à déposer sur un hébergeur de site (docs/sans-claude.md).
Chaque assemblage écrit aussi dist/packs/<id>.md : le pack de chaque matière prête, à importer dans une autre copie
de l'app (Profil › Importer un cours), par exemple la version sans contenu (--univers modeles/moteur).
v13 : sans --univers ni --dist, assemble aussi « Maitrise » (dist/maitrise/), la version vierge : aucun univers, aucune
matière, première configuration (12l). Le contenu du dépôt, au format d'échange (docs/format-donnees.md), est écrit
dans dist/donnees/contenu.maitrise.json. Ce qui est propre à la personne (nom de l'app, prénom donné à l'IA) vient de
univers/app.json, pas du code.
i18n : les tables de l'interface sont dans src/i18n/<langue>/*.json (contrôlées : mêmes clés et mêmes {variables} dans
chaque langue, chaque t("clé") du code existe) ; le contenu a ses variantes « X.en.md » à côté des originaux, contrôlées
comme eux et face à eux (mêmes identifiants et mêmes bonnes réponses). Voir src/i18n/README.md.
"""
import glob, html, io, json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
STATUTS = ("prête", "en préparation")
ID_RE = re.compile(r'^[A-Za-z0-9_-]+$')


class Erreurs(Exception):
    def __init__(self, liste): Exception.__init__(self, '\n'.join(liste)); self.liste = liste


def lire(p): return io.open(p, encoding='utf-8').read()


# ---------- Lecture des fichiers Markdown ----------
def lignes(p):
    return [l.rstrip('\r\n').rstrip() for l in io.open(p, encoding='utf-8')]

def blocs(ls, niveau, debut=0, fin=None):
    """Découpe ls[debut:fin] aux titres du niveau donné (## ou ###). Renvoie [(n° de ligne, titre, début, fin)]."""
    fin = len(ls) if fin is None else fin
    marque = '#' * niveau + ' '
    pos = [i for i in range(debut, fin) if ls[i].startswith(marque)]
    return [(i, ls[i][len(marque):].strip(), i + 1, pos[k + 1] if k + 1 < len(pos) else fin) for k, i in enumerate(pos)]

META_QCM = ('Thème', 'Explication', 'Source', 'Ordre fixe', 'Barème', 'Niveau', 'Regard', 'Rappel', 'Repère', 'Repère après', 'Type')
# v13.4 : autres façons de poser une question, dans une section « # QCM » : relier deux colonnes (associer), remettre
# dans l'ordre (ordonner), compléter de mémoire (trous). Même règle : packQcm (02).
TYPES_Q = ('associer', 'ordonner', 'trous')
PAIRE_RE = re.compile(r'^- (?!\[)(.+?) = (.+)$')
ORDRE_RE = re.compile(r'^(\d+)\. (.+)$')
META_EX = ('Thème', 'Étiquette', 'Durée conseillée', 'Barème', 'Source', 'Niveau', 'Regard', 'Repère')
META_SUB = ('Réponse', 'Tolérance', 'Accepté aussi', 'Calcul', 'Attendu', 'Indice', 'Niveau', 'Regard')
# Grille de maîtrise (v5.1) : les marches par défaut, les mêmes que MODELES dans src/js/08-matieres.js
NIVEAUX = ('comprendre', 'faire', 'expliquer', 'recommander')

def maitrise(it, m, ctl, ou, err):
    """Niveau (marche de la grille) et regard (au-delà du calcul) d'une question, contrôlés par la recette."""
    for cle, k, vals, quoi in (('Niveau', 'n', ctl['niv'], 'niveau'), ('Regard', 'r', ctl['reg'], 'regard')):
        if cle in m:
            if m[cle] in vals: it[k] = m[cle]
            else: err.append('%s : %s « %s » inconnu (%s)' % (ou, quoi, m[cle], ', '.join(vals) or 'aucun dans la recette : blocs.maitrise.regards'))

def meta(l, cles):
    m = re.match(r'^(.+?) : (.*)$', l)
    return (m.group(1), m.group(2).strip()) if m and m.group(1) in cles else None

def oui(v, ou, err):
    if v in ('oui', 'non'): return v == 'oui'
    err.append(ou + ' : « oui » ou « non » attendu, pas « %s »' % v); return False

def reperes(v, ou, err):
    """« Repère : DU, EH » : les lignes des documents types (documents.md) à surligner pour la question (v7.3).
    Leur existence est vérifiée à la fin de lire_matiere, une fois les documents lus."""
    ids = [x.strip() for x in v.split(',') if x.strip()]
    for x in ids:
        if not ID_RE.match(x): err.append(ou + ' : repère « %s » invalide (lettres, chiffres, - et _)' % x)
    if not ids: err.append(ou + ' : « Repère : » vide')
    return ids

def citation(ls, debut, fin):
    """Lignes « > texte » consécutives : l'énoncé, retours à la ligne conservés."""
    out = [l[2:] if l.startswith('> ') else '' for l in ls[debut:fin] if l == '>' or l.startswith('> ')]
    return '\n'.join(out)

def lire_qcm(ls, debut, fin, ident, nom, err, themes, theme=None, ctl=None, niv=None):
    """Une question à choix : texte, options « - [ ] » / « - [x] », puis Explication, Source et options."""
    q, opts, bonne, m, vu_opt, cle, ctx, paires, ordre = [], [], [], {}, False, None, [], [], []
    ou = '%s:%d (%s)' % (nom, debut, ident)
    def ici(i): return '%s:%d (%s)' % (nom, i + 1, ident)
    for i in range(debut, fin):
        l = ls[i]
        if not l: cle = None; continue
        mo = re.match(r'^- \[( |x|X)\] (.*)$', l)
        mm = meta(l, META_QCM)
        mp, mr = PAIRE_RE.match(l), ORDRE_RE.match(l)
        if mp and m.get('Type') == 'associer':
            paires.append((mp.group(1).strip(), mp.group(2).strip())); vu_opt = True; cle = None
        elif mr and m.get('Type') == 'ordonner':
            if int(mr.group(1)) != len(ordre) + 1: err.append(ici(i) + ' : étapes à numéroter 1, 2, 3… dans le bon ordre')
            ordre.append(mr.group(2).strip()); vu_opt = True; cle = None
        elif mo:
            if set(m) - {'Thème', 'Niveau', 'Regard', 'Rappel', 'Repère', 'Repère après', 'Type'}: err.append(ici(i) + ' : option après l\'explication')
            if mo.group(1) != ' ': bonne.append(len(opts))
            opts.append(mo.group(2).strip()); vu_opt = True; cle = None
        elif mm:
            if mm[0] in m: err.append(ici(i) + ' : « %s » en double' % mm[0])
            m[mm[0]] = mm[1]; cle = mm[0]
        elif cle and cle in ('Explication', 'Source'):
            m[cle] += ('\n' + l[2:].strip(' \t')) if l.startswith('| ') else (' ' + l.strip())  # « | » : à la ligne (écritures)
        elif (l == '>' or l.startswith('> ')) and not vu_opt and not q and not (set(m) - {'Thème', 'Niveau', 'Regard', 'Rappel', 'Repère', 'Repère après', 'Type'}):
            ctx.append(l[2:] if l.startswith('> ') else '')  # v7.3 : énoncé de la question (tableau, figure), avant elle
        elif not vu_opt and not (set(m) - {'Thème', 'Niveau', 'Regard', 'Rappel', 'Repère', 'Repère après', 'Type'}):
            q.append(l.strip())
        else:
            err.append(ici(i) + ' : ligne non reconnue : « %s »' % l[:60])
    it = {'id': ident, 'th': theme or m.get('Thème', ''), 'q': ' '.join(q), 'o': opts,
          'c': bonne[0] if len(bonne) == 1 else -1, 'e': m.get('Explication', ''), 's': m.get('Source', '')}
    ty = m.get('Type')
    if ty is not None and ty not in TYPES_Q: err.append('%s : « Type : %s » inconnu (%s)' % (ou, ty, ', '.join(TYPES_Q))); ty = None
    if ty: it['t'] = ty
    if ty == 'associer':
        it['o'], it['d'], it['c'] = [p[0] for p in paires], [p[1] for p in paires], -1
        if opts: err.append('%s : « Type : associer » : des lignes « - <gauche> = <droite> », pas de « - [ ] »' % ou)
        if not 3 <= len(paires) <= 6: err.append('%s : « Type : associer » : 3 à 6 paires « - <gauche> = <droite> »' % ou)
        if len(set(it['o'])) != len(paires) or len(set(it['d'])) != len(paires): err.append('%s : « Type : associer » : chaque côté sans doublon' % ou)
    elif ty == 'ordonner':
        it['o'], it['c'] = ordre, -1
        if opts: err.append('%s : « Type : ordonner » : des lignes « 1. … », pas de « - [ ] »' % ou)
        if not 3 <= len(ordre) <= 7: err.append('%s : « Type : ordonner » : 3 à 7 étapes « 1. … »' % ou)
        if len(set(ordre)) != len(ordre): err.append('%s : « Type : ordonner » : deux étapes identiques' % ou)
    elif ty == 'trous' and '___' not in it['q']: err.append('%s : « Type : trous » : la question contient « ___ » à la place du mot attendu' % ou)
    if oui(m['Ordre fixe'], ou, err) if 'Ordre fixe' in m else False: it['fixed'] = True
    if oui(m['Barème'], ou, err) if 'Barème' in m else False: it['b'] = True
    if 'Rappel' in m: it['rl'] = oui(m['Rappel'], ou, err)  # v7.1 : revenir sans les choix (rappel libre) ou jamais
    if ctx:
        it['ctx'] = '\n'.join(ctx).strip('\n')
        controle_enonce(ls, debut, fin, nom, err)
    if 'Repère' in m: it['rp'] = reperes(m['Repère'], ou, err)  # v7.3 : lignes des documents types (documents.md)
    if 'Repère après' in m: it['rpa'] = reperes(m['Repère après'], ou, err)  # montrées seulement avec la correction
    if niv and 'Niveau' not in m: m['Niveau'] = niv
    maitrise(it, m, ctl or CTL0, ou, err)
    if not ID_RE.match(ident): err.append('%s : identifiant « %s » invalide (lettres, chiffres, - et _ seulement)' % (ou, ident))
    if not it['q']: err.append('%s : question vide' % ou)
    if ty in ('associer', 'ordonner'): pass
    elif len(opts) < (1 if ty == 'trous' else 2): err.append('%s : il faut au moins 2 options' % ou)
    if ty not in ('associer', 'ordonner') and len(bonne) != 1: err.append('%s : il faut exactement une bonne réponse « - [x] » (%d trouvée(s))' % (ou, len(bonne)))
    if not it['e']: err.append('%s : explication manquante (« Explication : … »)' % ou)
    if not it['s']: err.append('%s : source manquante (« Source : … »)' % ou)
    if it['th'] not in themes: err.append('%s : thème « %s » inconnu de la recette' % (ou, it['th']))
    return it

NB_RE = re.compile(r'^([−-]?\d+(?:[ \u00a0\u202f]\d{3})*(?:,\d+)?)\s*(.*)$')
def nombre(s):
    m = NB_RE.match(s.strip())
    if not m: return None, s
    v = float(re.sub(r'[ \u00a0\u202f]', '', m.group(1)).replace('−', '-').replace(',', '.'))
    return (int(v) if v == int(v) else v), m.group(2).strip()

CTL0 = {'niv': NIVEAUX, 'reg': ()}
def lire_qcm_fichier(p, th, themes, nom_theme, err, ctl):
    ls, nom = lignes(p), os.path.relpath(p, ROOT)
    titre = next((l[2:].strip() for l in ls if l.startswith('# ')), None)
    if titre != nom_theme: err.append('%s : le titre « # %s » doit être le nom du thème dans la recette : « %s »' % (nom, titre, nom_theme))
    return [lire_qcm(ls, d, f, t, nom, err, themes, th, ctl) for n, t, d, f in blocs(ls, 2)]

def sans_type(items, nom, err):
    """v13.4 : associer, ordonner et trous seulement dans une section « # QCM » (pas dans un cas ni une simulation)."""
    for it in items:
        if it.get('t'): err.append('%s (%s) : « Type : %s » : seulement dans les QCM d\'un thème' % (nom, it['id'], it['t']))
    return items

def lire_reserve(p, themes, err, ctl):
    ls, nom = lignes(p), os.path.relpath(p, ROOT)
    return sans_type([lire_qcm(ls, d, f, t, nom, err, themes, None, ctl) for n, t, d, f in blocs(ls, 2)], nom, err)

def lire_cas(p, themes, err, ctl):
    ls, nom, out = lignes(p), os.path.relpath(p, ROOT), []
    for n, titre, d, f in blocs(ls, 2):
        ou = '%s:%d' % (nom, n + 1)
        k, _, nomcas = titre.partition(' · ')
        etapes = blocs(ls, 3, d, f)
        tete = etapes[0][0] if etapes else f
        th = next((mm[1] for mm in (meta(l, ('Thème',)) for l in ls[d:tete]) if mm), '')
        niv = next((mm[1] for mm in (meta(l, ('Niveau',)) for l in ls[d:tete]) if mm), None)  # marche de toutes les étapes
        c = {'k': k.strip(), 'th': th, 'n': nomcas.strip(), 'ctx': citation(ls, d, tete),
             'steps': sans_type([lire_qcm(ls, d2, f2, t, nom, err, themes, th, ctl, niv) for n2, t, d2, f2 in etapes], nom, err)}
        if not c['n']: err.append(ou + ' : titre attendu « ## <clé> · <nom du cas> »')
        if th not in themes: err.append(ou + ' : thème « %s » inconnu' % th)
        if not c['ctx']: err.append(ou + ' : énoncé manquant (lignes « > … »)')
        controle_enonce(ls, d, tete, nom, err)
        if not c['steps']: err.append(ou + ' : aucune étape « ### <identifiant> »')
        out.append(c)
    return out

def lire_exercices(p, themes, err, ctl):
    ls, nom, out = lignes(p), os.path.relpath(p, ROOT), []
    for n, titre, d, f in blocs(ls, 2):
        ou = '%s:%d' % (nom, n + 1)
        ident, _, t = titre.partition(' · ')
        qs = blocs(ls, 3, d, f)
        tete = qs[0][0] if qs else f
        m = {}
        for l in ls[d:tete]:
            mm = meta(l, META_EX)
            if mm: m[mm[0]] = mm[1]
            elif l and not (l == '>' or l.startswith('> ')): err.append('%s : ligne non reconnue : « %s »' % (ou, l[:60]))
        e = {'id': ident.strip(), 'th': m.get('Thème', ''), 't': t.strip()}
        if 'Étiquette' in m: e['tl'] = m['Étiquette']
        dm = re.match(r'^(\d+) min$', m.get('Durée conseillée', ''))
        e['min'] = int(dm.group(1)) if dm else 0
        e['b'] = oui(m['Barème'], ou, err) if 'Barème' in m else False
        e['src'] = m.get('Source', '')
        e['ctx'] = citation(ls, d, tete)
        controle_enonce(ls, d, tete, nom, err)
        e['subs'] = []
        if 'Regard' in m: maitrise(e, {'Regard': m['Regard']}, ctl, ou, err)
        if 'Repère' in m: e['rp'] = reperes(m['Repère'], ou, err)
        for n2, _t, d2, f2 in qs:
            ou2 = '%s:%d' % (nom, n2 + 1)
            q, sm, cle = [], {}, None
            for l in ls[d2:f2]:
                if not l: cle = None; continue
                mm = meta(l, META_SUB)
                if mm: sm[mm[0]] = mm[1]; cle = mm[0]
                elif cle in ('Calcul', 'Attendu', 'Indice'): sm[cle] += ('\n' + l[2:].strip(' \t')) if l.startswith('| ') else (' ' + l.strip())
                elif not sm: q.append(l.strip())
                else: err.append('%s : ligne non reconnue : « %s »' % (ou2, l[:60]))
            if 'Réponse' in sm:
                a, u = nombre(sm['Réponse'])
                s = {'k': 'num', 'q': ' '.join(q), 'a': a, 'u': u, 'sol': sm.get('Calcul', '')}
                if a is None: err.append(ou2 + ' : « Réponse : » doit commencer par un nombre')
                if 'Tolérance' in sm: s['tol'] = nombre(sm['Tolérance'])[0]
                if 'Accepté aussi' in sm: s['alt'] = [nombre(x)[0] for x in sm['Accepté aussi'].split(' ou ')]
                if a is not None and a < 0: s['neg'] = True
                if not s['sol']: err.append(ou2 + ' : « Calcul : » manquant')
                if None in s.get('alt', []) or ('tol' in s and s['tol'] is None): err.append(ou2 + ' : nombre illisible')
            elif 'Attendu' in sm:
                s = {'k': 'txt', 'q': ' '.join(q), 'm': sm['Attendu']}
            else:
                err.append(ou2 + ' : il faut « Réponse : » (chiffrée) ou « Attendu : » (rédigée)'); continue
            if 'Indice' in sm: s['ind'] = sm['Indice']  # v6.4 : premier indice du mode guidé, sans donner le résultat
            if 'Niveau' not in sm and 'Niveau' in m: sm['Niveau'] = m['Niveau']  # niveau de l'exercice, sauf pour cette question
            maitrise(s, sm, ctl, ou2, err)
            if not s['q']: err.append(ou2 + ' : question vide')
            e['subs'].append(s)
        if not ID_RE.match(e['id']): err.append('%s : identifiant « %s » invalide' % (ou, e['id']))
        if not e['t']: err.append(ou + ' : titre attendu « ## <identifiant> · <titre> »')
        if e['th'] not in themes: err.append(ou + ' : thème « %s » inconnu' % e['th'])
        if not e['min']: err.append(ou + ' : « Durée conseillée : <n> min » manquante')
        if not e['src']: err.append(ou + ' : source manquante')
        if not e['ctx']: err.append(ou + ' : énoncé manquant (lignes « > … »)')
        if not e['subs']: err.append(ou + ' : aucune question « ### Question <n> »')
        out.append(e)
    return out

CONSIGNES = {"Consigne · explication d'une question": 'instr',
             'Consigne · question sur un exercice': 'exq',
             "Consigne · correction d'une copie": 'corr'}
def lire_regles(p, themes, err):
    ls, nom = lignes(p), os.path.relpath(p, ROOT)
    out = {'regles': [], 'par_theme': {}}
    for n, titre, d, f in blocs(ls, 2):
        ou = '%s:%d' % (nom, n + 1)
        corps = [l for l in ls[d:f] if l]
        if titre in CONSIGNES:
            out[CONSIGNES[titre]] = '\n'.join(corps)
        elif titre.startswith('Règle · '):
            th = meta(corps[0], ('Thèmes',)) if corps else None
            if not th: err.append(ou + ' : la ligne « Thèmes : … » doit suivre le titre'); continue
            i = len(out['regles'])
            out['regles'].append('\n'.join(corps[1:]))
            for t in [x.strip() for x in th[1].split(',') if x.strip()]:
                if t not in themes: err.append(ou + ' : thème « %s » inconnu' % t)
                out['par_theme'].setdefault(t, []).append(i)
        else:
            err.append(ou + ' : section inconnue « %s »' % titre)
    for k, v in CONSIGNES.items():
        if v not in out: err.append('%s : section « ## %s » manquante' % (nom, k))
    return out


def regles_des_fiches(cl, cours, themes):
    """v13 : un thème sans « Règle · » reçoit « L'essentiel » de sa fiche comme règle envoyée à l'IA. Un pack n'a plus
    à réécrire le cours dans « # Règles ». Même règle dans l'app (packReglesFiches, 02)."""
    noms = {x.get('id'): x.get('nom') or x.get('id') for x in themes}
    for k in cours:
        t = k['th']
        if t in cl['par_theme'] or not k['sections']: continue
        cl['par_theme'][t] = [len(cl['regles'])]
        cl['regles'].append('%s : l\'essentiel\n%s' % (noms.get(t, t), cle_fiche(k)['md']))


def cle_fiche(k):
    """La section clé d'une fiche : « L'essentiel » (en tête, ancien format) ou « À retenir » (en dernier, v13.1)."""
    return k['sections'][-1] if k.get('intro') else k['sections'][0]


# ---------- Figures et tableaux (v7.3) : dans les fiches de cours et dans les énoncés ----------
# Demande de l'auteur (18 oct.) : « je suis très visuel » ; des schémas, tableaux, graphiques, courbes, camemberts dans
# les cours, et des tableaux lisibles dans les questions pleines de chiffres. Une figure s'écrit entre « ::: <type>
# <titre> » et « ::: » ; format dans univers/README.md (« Figures »). build.py ne fait que la contrôler (les chiffres
# d'une cascade doivent tomber juste, les deux côtés d'un bilan être égaux) ; l'app la lit avec packFigure (02, mêmes
# règles) et la dessine (03d).
FIG_TYPES = ('cascade', 'bilan', 'barres', 'courbe', 'camembert', 'etapes', 'essai', 'ecriture')
FIG_DEBUT = re.compile(r'^:::\s*(\S+)\s*(.*)$')
FIG_CLE = re.compile(r'^(Note|Unité|Séries|Axe|Total|Écart|Colonnes)\s*:\s*(.*)$')
FIG_CLES = {'cascade': ('Note', 'Unité'), 'bilan': ('Note', 'Unité', 'Colonnes', 'Écart'), 'barres': ('Note', 'Unité', 'Séries'),
            'courbe': ('Note', 'Unité', 'Axe'), 'camembert': ('Note', 'Unité', 'Total'), 'etapes': ('Note',), 'essai': (),
            'ecriture': ('Note',)}

def fig_nombre(s):
    """Un nombre seul, écrit à la française (« 1 025 000 », « − 7 022 », « 26,69 ») ; None sinon."""
    v, reste = nombre(re.sub(r'^([−-])\s+(?=\d)', r'\1', s.strip()))
    return v if v is not None and reste == '' else None

def fig_tol(vals):
    """Écart toléré entre un total écrit et le calcul : 1 sur des entiers (arrondis des corrigés), 0,05 avec des décimales."""
    return 0.05 if any(v != int(v) for v in vals) else 1

def controle_figure(typ, titre, corps):
    """Contrôle d'une figure. corps : ses lignes, sans les « ::: ». Renvoie [(indice dans corps, message)] ; -1 = la
    ligne « ::: <type> <titre> ». Mêmes règles que packFigure (src/js/02-packs.js)."""
    e = []
    if typ not in FIG_TYPES: return [(-1, 'figure « %s » inconnue (%s)' % (typ, ', '.join(FIG_TYPES)))]
    if not titre: e.append((-1, 'titre manquant : « ::: %s <titre> »' % typ))
    cles, ecarts, data = {}, [], []
    for i, l in enumerate(corps):
        l = l.strip()
        if not l: continue
        m = FIG_CLE.match(l)
        if m:
            k, v = m.group(1), m.group(2).strip()
            if k not in FIG_CLES[typ]: e.append((i, '« %s : » ne va pas dans une figure « %s »' % (k, typ)))
            elif k == 'Écart': ecarts.append((i, v))
            elif k in cles: e.append((i, '« %s : » en double' % k))
            elif not v: e.append((i, '« %s : » vide' % k))
            else: cles[k] = (i, v)
            continue
        data.append((i, l))
    def nb(i, s, pos=False):
        v = fig_nombre(s)
        if v is None: e.append((i, 'nombre illisible : « %s »' % s)); return None
        if pos and v < 0: e.append((i, 'montant négatif « %s » : ici, le signe ne va pas dans le nombre' % s)); return None
        return v
    def parts(l): return [p.strip() for p in l.split('|')]
    def nombre_de(i, n, lo, hi, quoi):
        if not lo <= n <= hi: e.append((i, 'de %d à %d %s attendus, %d ici' % (lo, hi, quoi, n)))
    if typ == 'cascade':
        tot, vus, debut, dernier = None, [], True, None
        for i, l in data:
            m = re.match(r'^([+=]|[−-])\s+(.*)$', l); p = parts(m.group(2)) if m else []
            if len(p) != 2 or not p[0]:
                e.append((i, 'ligne attendue : « + libellé | montant », « − libellé | montant » ou « = libellé | montant »'))
                tot, debut = None, False; continue
            s = '-' if m.group(1) in '−-' else m.group(1)
            v, dernier = nb(i, p[1], s != '='), s
            if v is not None: vus.append(v)
            if debut:
                debut = False
                if s == '-': e.append((i, 'la cascade commence par « + » ou « = » (le point de départ)'))
                tot = v if s != '-' else None
            elif s == '=':
                if tot is not None and v is not None and abs(tot - v) > fig_tol(vus):
                    e.append((i, '« = %s » : le calcul donne %s, la ligne dit %s' % (p[0], fmt_fig(tot), p[1])))
                tot = v
            elif tot is not None and v is not None: tot = tot + v if s == '+' else tot - v
            else: tot = None
        nombre_de(-1, len(data), 2, 16, 'lignes')
        if data and dernier != '=': e.append((data[-1][0], 'la cascade finit par une ligne « = » (le résultat)'))
    elif typ == 'bilan':
        g, d, cote = [], [], 0
        for i, l in data:
            if l == '--':
                if cote: e.append((i, 'un seul « -- » (entre la colonne de gauche et celle de droite)'))
                cote = 1; continue
            p = parts(l)
            if len(p) not in (2, 3) or not p[0] or (len(p) == 3 and not p[2]):
                e.append((i, 'ligne attendue : « libellé | montant » ou « libellé | montant | famille »')); continue
            v = nb(i, p[1], True)
            if v is not None: (d if cote else g).append(v)
        if not cote: e.append((-1, 'il manque la ligne « -- » entre la colonne de gauche et celle de droite'))
        elif not (1 <= len(g) <= 8 and 1 <= len(d) <= 8): e.append((-1, 'de 1 à 8 masses de chaque côté'))
        elif abs(sum(g) - sum(d)) > fig_tol(g + d): e.append((-1, 'les deux côtés ne sont pas égaux : %s à gauche, %s à droite' % (fmt_fig(sum(g)), fmt_fig(sum(d)))))
        if 'Colonnes' in cles and (len(parts(cles['Colonnes'][1])) != 2 or not all(parts(cles['Colonnes'][1]))):
            e.append((cles['Colonnes'][0], '« Colonnes : gauche | droite » attendu'))
        for i, v in ecarts:
            p = parts(v)
            if len(p) != 3 or not p[0] or not re.match(r'^\d+$', p[1]) or not re.match(r'^\d+$', p[2]):
                e.append((i, '« Écart : libellé | n | m » attendu (n masses à gauche, m à droite)'))
            elif cote and not (1 <= int(p[1]) <= len(g) and 1 <= int(p[2]) <= len(d)):
                e.append((i, 'écart « %s » : %s masses à gauche et %s à droite demandées, il y en a %d et %d' % (p[0], p[1], p[2], len(g), len(d))))
    elif typ in ('barres', 'courbe'):
        if typ == 'barres':
            se = parts(cles['Séries'][1]) if 'Séries' in cles else ['']
            if 'Séries' in cles and (not 2 <= len(se) <= 3 or not all(se)): e.append((cles['Séries'][0], '« Séries : a | b » : 2 ou 3 noms'))
            n, lo, hi, quoi = len(se), 1, 12, 'barres'
        else:
            ax = parts(cles['Axe'][1]) if 'Axe' in cles else []
            if 'Axe' not in cles: e.append((-1, 'ligne « Axe : x1 | x2 | … » manquante'))
            elif not (2 <= len(ax) <= 12 and all(ax)): e.append((cles['Axe'][0], '« Axe : » : de 2 à 12 repères'))
            n, lo, hi, quoi = len(ax), 1, 3, 'courbes'
        for i, l in data:
            p = parts(l)
            if len(p) != n + 1 or not p[0]: e.append((i, 'ligne attendue : « libellé | %s » (%d nombre%s)' % (' | '.join(['nombre'] * max(n, 1)), n, 's' if n > 1 else ''))); continue
            for x in p[1:]: nb(i, x)
        nombre_de(-1, len(data), lo, hi, quoi)
    elif typ == 'camembert':
        vs = []
        for i, l in data:
            p = parts(l)
            if len(p) != 2 or not p[0]: e.append((i, 'ligne attendue : « libellé | montant »')); continue
            v = nb(i, p[1], True)
            if v is not None:
                if v == 0: e.append((i, 'une part ne peut pas être nulle'))
                vs.append(v)
        nombre_de(-1, len(data), 2, 6, 'parts')
        if 'Total' in cles:
            t = nb(cles['Total'][0], cles['Total'][1])
            if t is not None and len(vs) == len(data) and abs(sum(vs) - t) > fig_tol(vs + [t]):
                e.append((cles['Total'][0], 'les parts font %s, pas %s' % (fmt_fig(sum(vs)), cles['Total'][1])))
    elif typ == 'etapes':
        for i, l in data:
            p = parts(l)
            if len(p) > 2 or not p[0]: e.append((i, 'ligne attendue : « étape » ou « étape | détail »'))
        nombre_de(-1, len(data), 2, 8, 'étapes')
    elif typ == 'essai':
        # v7.4 : « À toi ». Le titre est la question ; les lignes avant « -- », les données (facultatives) ; après, la
        # réponse, cachée jusqu'à « Voir la réponse ». Chercher avant de lire la solution aide à retenir (grille-cours.md).
        seps = [i for i, l in data if l == '--']
        if len(seps) != 1: e.append((seps[1] if len(seps) > 1 else -1, 'une ligne « -- » et une seule, entre les données et la réponse'))
        elif not [l for i, l in data if i > seps[0]]: e.append((seps[0], 'la réponse manque, après la ligne « -- »'))
    elif typ == 'ecriture':
        # v10.4 : une écriture au journal, un compte par ligne, les débits d'abord : « D | compte | libellé » ou
        # « C | compte | libellé », avec « | montant » sur toutes les lignes ou sur aucune ; alors débits = crédits.
        sens, mts, vu_c = [], [], False
        for i, l in data:
            p = parts(l)
            if len(p) not in (3, 4) or p[0] not in ('D', 'C') or not p[1] or not p[2]:
                e.append((i, 'ligne attendue : « D | compte | libellé » ou « C | compte | libellé », avec « | montant » au besoin')); continue
            if p[0] == 'C': vu_c = True
            elif vu_c: e.append((i, 'un débit après un crédit : les débits d\'abord'))
            sens.append(p[0])
            mts.append((i, p[0], nb(i, p[3], True) if len(p) == 4 else None, len(p) == 4))
        if 'D' not in sens or 'C' not in sens: e.append((-1, 'il faut au moins un débit et un crédit'))
        avec = [m for m in mts if m[3]]
        if avec and len(avec) != len(mts): e.append((-1, 'montants sur toutes les lignes ou sur aucune'))
        elif avec and all(m[2] is not None for m in mts):
            d, c = sum(m[2] for m in mts if m[1] == 'D'), sum(m[2] for m in mts if m[1] == 'C')
            if abs(d - c) > 0.005: e.append((-1, 'écriture déséquilibrée : %s au débit, %s au crédit' % (fmt_fig(d), fmt_fig(c))))
    return e

def fmt_fig(v):
    """Un nombre à la française, pour les messages : 29 209 ; − 7 848 ; 26,69."""
    s = ('%.2f' % abs(v)).rstrip('0').rstrip('.') if v != int(v) else '%d' % abs(v)
    ent, _, dec = s.partition('.')
    ent = re.sub(r'(\d)(?=(\d{3})+$)', r'\1 ', ent)
    return ('− ' if v < 0 else '') + ent + (',' + dec if dec else '')

TABLE_SEP = re.compile(r'^\|(\s*:?-{3,}:?\s*\|)+$')
ENCADRES = ('definition', 'formule', 'exemple', 'attention', 'source')
def controle_visuels(items, ou, err, enc_ok=False):
    """Tableaux et figures d'un texte : items = [(n° de ligne, texte)] ; ou(n) situe une ligne dans les messages.
    Sert aux sections des fiches (lire_cours) et aux énoncés « > » (cas, exercices, QCM). Même règle : packVisuels (02).
    v13.1 : dans une fiche (enc_ok), encadrés typés « ::: definition|formule|exemple|attention|source <titre> » … « ::: »,
    du Markdown de fiche dedans (un tableau ou une figure aussi), jamais un encadré dans un autre."""
    tab, fig, enc = None, None, None
    for n, l in items:
        if fig is not None:
            if l.strip() == ':::':
                for i, msg in controle_figure(fig[1], fig[2], [x for _n, x in fig[3]]):
                    err.append(ou(fig[0] if i < 0 else fig[3][i][0]) + ' : figure « %s » : %s' % (fig[1], msg))
                fig = None
            else: fig[3].append((n, l))
            continue
        m = FIG_DEBUT.match(l)
        if m and m.group(1) in ENCADRES:
            if not enc_ok: err.append(ou(n) + ' : encadré « %s » : seulement dans une fiche de cours' % m.group(1))
            elif enc is not None: err.append(ou(n) + ' : encadré « %s » dans un autre encadré : ferme le premier par « ::: »' % m.group(1))
            enc = (n, m.group(1)); tab = None; continue
        if enc is not None and l.strip() == ':::': enc = None; tab = None; continue
        if m: fig = (n, m.group(1), m.group(2).strip(), []); tab = None; continue
        if not l.startswith('|'): tab = None; continue
        c = l.count('|') - 1
        if not l.endswith('|') or c < 1: err.append(ou(n) + ' : une ligne de tableau commence et finit par « | »')
        elif tab is None: tab = [c, 1]
        else:
            tab[1] += 1
            if c != tab[0]: err.append(ou(n) + ' : %d colonnes ici, %d dans l\'en-tête du tableau' % (c, tab[0]))
            if tab[1] == 2 and not TABLE_SEP.match(l): err.append(ou(n) + ' : la 2e ligne d\'un tableau est « |---|---| »')
    if fig is not None: err.append(ou(fig[0]) + ' : figure « %s » sans ligne « ::: » de fin' % fig[1])
    if enc is not None: err.append(ou(enc[0]) + ' : encadré « %s » sans ligne « ::: » de fin' % enc[1])

def controle_enonce(ls, d, f, nom, err):
    """Les lignes « > » d'un énoncé (cas, exercice, QCM) : leurs tableaux et leurs figures (v7.3)."""
    items = [(i, l[2:] if l.startswith('> ') else '') for i in range(d, f) for l in (ls[i],) if l == '>' or l.startswith('> ')]
    controle_visuels(items, lambda i: '%s:%d' % (nom, i + 1), err)


# ---------- Fiches de cours (v7.2) : cours/<thème>.md ----------
ESSENTIEL = ("L'essentiel", "L’essentiel")
A_RETENIR = ('À retenir', 'A retenir')
def lire_cours(ls, nom, th, err, dec=0):
    """Une fiche : « Durée : <n> min » facultatif, des sections « ## <titre> » dont la première est « L'essentiel »,
    puis une ligne « Sources : … ». Le texte des sections est du Markdown simple (paragraphes, listes « - » et « 1. »,
    « ### », **gras**, encadrés « > », tableaux, figures « ::: » depuis la v7.3), mis en page par l'app (coursMd, 03c).
    Mêmes règles : packCours (02).
    v13.1, second format : « Introduction : <2 ou 3 phrases> » avant les sections, au moins deux parties « ## », puis
    « ## À retenir » en dernier (ce qu'il faut savoir par cœur, envoyé à l'aide de l'IA). L'app numérote les parties et
    en fait le plan. « L'essentiel » de l'ancien format et « À retenir » sont la section clé (cle_fiche)."""
    ls = [norm_ligne(l) for l in ls]
    out, cur, fin = {'th': th, 'min': None, 'sections': [], 'src': ''}, None, False
    for i, l in enumerate(ls):
        ou = '%s:%d' % (nom, i + 1 + dec)
        if fin:
            if l: err.append(ou + ' : rien après la ligne « Sources : »')
            continue
        m = re.match(r'^Durée : (\d+) min$', l)
        if m and cur is None: out['min'] = int(m.group(1)); continue
        if l.startswith('Introduction :') and cur is None:  # v13.1
            out['intro'] = l[14:].strip()
            if not out['intro']: err.append(ou + ' : « Introduction : <2 ou 3 phrases> » vide')
            continue
        if l.startswith('Avant de lire :') and cur is None:  # v7.4 : une question à tenter avant de lire la fiche
            out['av'] = l[15:].strip()
            if not out['av']: err.append(ou + ' : « Avant de lire : <une question> » vide')
            continue
        if l.startswith('Sources : '): out['src'] = l[10:].strip(); fin = True; continue
        if l.startswith('## '): cur = {'t': l[3:].strip(), 'l': [], 'n': []}; out['sections'].append(cur); continue
        if l.startswith('#') and not l.startswith('### ') or l.startswith('```'):
            err.append(ou + ' : « %s » : seuls « ## <section> » et « ### <sous-titre> » sont permis' % l[:30]); continue
        if cur is None:
            if l: err.append(ou + ' : texte avant la première section (« Introduction : … », puis « ## <partie> » ; ou « ## L\'essentiel »)')
            continue
        cur['l'].append(l); cur['n'].append(i)
    for s in out['sections']:
        controle_visuels(list(zip(s.pop('n'), s['l'])), lambda i: '%s:%d' % (nom, i + 1 + dec), err, True)
        s['md'] = '\n'.join(s.pop('l')).strip('\n')
        if not s['md']: err.append('%s : section « %s » vide' % (nom, s['t']))
    ts = [s['t'] for s in out['sections']]
    if not ts: err.append(nom + ' : aucune section « ## <titre> »')
    elif 'intro' in out:
        if ts[-1] not in A_RETENIR: err.append(nom + ' : avec « Introduction : », la dernière section est « ## À retenir »')
        elif len(ts) < 3: err.append(nom + ' : au moins deux parties « ## <titre> » avant « ## À retenir »')
        if any(x in ESSENTIEL or x in A_RETENIR for x in ts[:-1]): err.append(nom + ' : « L\'essentiel » ou « À retenir » : une seule fois, en dernier')
    elif ts[0] not in ESSENTIEL: err.append(nom + ' : la fiche commence par « Introduction : … » (et finit par « ## À retenir »), ou par « ## L\'essentiel »')
    if not out['src']: err.append(nom + ' : ligne « Sources : … » manquante (à la fin)')
    return out


# ---------- Relecture des fiches (v7.4) : revue.md ----------
# Demande de l'auteur (18 oct.) : juger chaque fiche sur le fond et sur la forme, et le montrer par une pastille. La grille
# (docs/grille-cours.md, sources des critères) vaut pour toutes les matières. Une relecture vaut pour le texte relu :
# son empreinte est gardée, et la pastille tombe dès que la fiche change (même calcul dans l'app : coursEmpreinte, 03c).
GRILLE = (
    ('juste', 'fond', 'Juste', 'Chiffres refaits, formules conformes aux supports, conflits entre supports signalés.'),
    ('sources', 'fond', 'Sourcée', 'Chaque fait renvoie à un document précis ; un fait extérieur au cours est sourcé.'),
    ('examen', 'fond', 'Alignée sur l\'examen', 'Ce que l\'examen demande, au niveau demandé, avec le plan attendu.'),
    ('marches', 'fond', 'Les quatre marches', 'Comprendre, savoir faire, expliquer, recommander, et les regards, quand l\'examen les demande.'),
    ('exemples', 'fond', 'Exemples et pièges', 'Un exemple résolu pas à pas, tiré des cas, et les erreurs typiques avec leur faux résultat.'),
    ('structure', 'forme', 'Structure signalée', 'Le même plan d\'une fiche à l\'autre, des titres qui disent ce qu\'il y a dessous.'),
    ('mots', 'forme', 'Les mots d\'abord', 'Le vocabulaire et les sigles expliqués avant le calcul.'),
    ('concis', 'forme', 'Concise', 'Rien d\'inutile, aucun doublon, ni dans la fiche ni d\'une fiche à l\'autre.'),
    ('visuel', 'forme', 'Visuel utile', 'Une figure montre le mécanisme central, à côté du texte qui l\'explique.'),
    ('lisible', 'forme', 'Lisible', 'Phrases courtes, tutoiement, chiffres en tableau plutôt qu\'en paragraphe.'),
    ('actif', 'forme', 'Fait chercher', 'Une question avant de lire, un calcul à tenter avant la solution, un auto-test.'),
    ('envie', 'forme', 'Donne envie', 'Une accroche concrète au début, l\'utilité dite tôt, du simple au difficile.'),
)
VERDICTS = ('oui', 'en partie', 'non', 'sans objet')
REVUE_LIGNE = re.compile(r'^- ([a-z]+) · (oui|en partie|non|sans objet) · (.+)$')
DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def empreinte(c):
    """Empreinte d'une fiche lue par lire_cours : FNV-1a sur 32 bits des octets UTF-8 de sa durée, ses sections et ses
    sources. Même calcul : coursEmpreinte (03c)."""
    s = '%s\n%s\n%s' % (c['min'] or '', '\n'.join(x['t'] + '\n' + x['md'] for x in c['sections']), c['src'])
    if c.get('av'): s += '\n' + c['av']
    if c.get('intro'): s += '\nI:' + c['intro']  # v13.1 : les fiches d'avant gardent leur empreinte
    h = 0x811c9dc5
    for b in s.encode('utf-8'): h = ((h ^ b) * 0x01000193) & 0xffffffff
    return '%08x' % h


def lire_revue(ls, nom, cours, err):
    """revue.md : « Date : AAAA-MM-JJ », « Par : … », puis une section « ## <thème> » par fiche relue, avec
    « Empreinte : <8 chiffres hexadécimaux> » et une ligne par critère de la grille :
    « - <critère> · oui|en partie|non|sans objet · <ce qui a été vu> ». Renvoie {date, par, fiches, perimees}."""
    out = {'date': '', 'par': '', 'fiches': {}, 'perimees': []}
    par_th = dict((c['th'], c) for c in cours)
    for i, l in enumerate(ls):
        if l.startswith('Date : '): out['date'] = l[7:].strip()
        elif l.startswith('Par : '): out['par'] = l[6:].strip()
        elif l.startswith('## '): break
    if not DATE_RE.match(out['date']): err.append(nom + ' : ligne « Date : AAAA-MM-JJ » attendue avant les fiches')
    if not out['par']: err.append(nom + ' : ligne « Par : … » attendue (qui a relu)')
    ids = [g[0] for g in GRILLE]
    for n, th, d, f in blocs(ls, 2):
        ou = '%s:%d' % (nom, n + 1)
        if th not in par_th: err.append('%s : pas de fiche « cours/%s.md » à relire' % (ou, th)); continue
        if th in out['fiches']: err.append('%s : fiche « %s » relue deux fois' % (ou, th)); continue
        x = {'h': '', 'v': {}}
        for i in range(d, f):
            l, oui_ = ls[i], '%s:%d' % (nom, i + 1)
            if not l: continue
            if l.startswith('Empreinte : '): x['h'] = l[12:].strip(); continue
            m = REVUE_LIGNE.match(l)
            if not m: err.append(oui_ + ' : ligne attendue : « - <critère> · oui|en partie|non|sans objet · <ce que tu as vu> »'); continue
            if m.group(1) not in ids: err.append('%s : critère « %s » inconnu (%s)' % (oui_, m.group(1), ', '.join(ids))); continue
            if m.group(1) in x['v']: err.append('%s : critère « %s » en double' % (oui_, m.group(1))); continue
            x['v'][m.group(1)] = [m.group(2), m.group(3).strip()]
        manque = [k for k in ids if k not in x['v']]
        if manque: err.append('%s : critères manquants : %s' % (ou, ', '.join(manque)))
        if not re.match(r'^[0-9a-f]{8}$', x['h']): err.append(ou + ' : « Empreinte : <8 chiffres hexadécimaux> » attendue (python3 build.py --empreintes <dossier>)')
        elif x['h'] != empreinte(par_th[th]): out['perimees'].append(th)
        out['fiches'][th] = x
    if not out['fiches']: err.append(nom + ' : aucune fiche relue (« ## <thème> »)')
    return out


# ---------- Documents types (v7.3) : documents.md ----------
# Demande de l'auteur (18 oct.) : un modèle lisible du bilan et du compte de résultat, pour savoir le jour J où chercher
# chaque chiffre. Un document = ses lignes dans l'ordre de l'examen, chacune avec son code (liasse fiscale) et ce que
# l'analyse en fait. Les questions désignent leurs lignes par « Repère : <code>, <code> ». Même lecture : packDocuments (02).
DOC_LIGNE = re.compile(r'^- ([A-Za-z0-9_-]+)(?: / ([A-Za-z0-9_-]+))? · (.+?)(?: · (.+))?$')
def lire_documents(ls, nom, err, dec=0):
    """« ## <id> · <titre> », « Source : … », « Colonnes : <1re> · <2e> » (facultatif, v8), une intro en lignes « > »
    (facultative), des groupes « ### <nom> » et leurs lignes « - <code> · <poste> · <ce que l'analyse en fait> » (la 3e
    partie est facultative). v8 : « - BJ / BK · … » donne le code de la 2e colonne (à l'actif, les amortissements)."""
    out, vus = [], set()
    for n, titre, d, f in blocs(ls, 2):
        ou = '%s:%d' % (nom, n + 1 + dec)
        ident, _, t = titre.partition(' · ')
        doc = {'id': ident.strip(), 't': t.strip(), 'src': '', 'intro': citation(ls, d, f), 'g': []}
        for i in range(d, f):
            l, oui_ = ls[i], '%s:%d' % (nom, i + 1 + dec)
            if not l or l == '>' or l.startswith('> '): continue
            if l.startswith('Source : '): doc['src'] = l[9:].strip(); continue
            if l.startswith('Colonnes : '):
                doc['col'] = [x.strip() for x in l[11:].split(' · ')]
                if len(doc['col']) != 2 or not all(doc['col']): err.append(oui_ + ' : « Colonnes : <1re colonne> · <2e colonne> » attendu')
                continue
            if l.startswith('### '): doc['g'].append({'t': l[4:].strip(), 'l': []}); continue
            m = DOC_LIGNE.match(l)
            if not m: err.append(oui_ + ' : ligne attendue : « - <code> · <poste> · <ce que tu en fais> »'); continue
            if not doc['g']: doc['g'].append({'t': '', 'l': []})
            x = {'k': m.group(1), 'p': m.group(3).strip()}
            if m.group(2): x['k2'] = m.group(2)
            if m.group(4): x['u'] = m.group(4).strip()
            for k in (x['k'], x.get('k2')):
                if k is None: continue
                if k in vus: err.append(oui_ + ' : code « %s » en double dans les documents' % k)
                vus.add(k)
            doc['g'][-1]['l'].append(x)
        if not ID_RE.match(doc['id']): err.append('%s : identifiant de document « %s » invalide' % (ou, doc['id']))
        if not doc['t']: err.append(ou + ' : titre attendu « ## <identifiant> · <titre> »')
        if not doc['src']: err.append(ou + ' : source manquante (« Source : … »)')
        if not any(g['l'] for g in doc['g']): err.append(ou + ' : aucune ligne « - <code> · <poste> »')
        if any(x['id'] == doc['id'] for x in out): err.append(ou + ' : document « %s » en double' % doc['id'])
        out.append(doc)
    if not out: err.append(nom + ' : aucun document « ## <identifiant> · <titre> »')
    return out


def codes_documents(docs):
    """Chaque code des documents (1re et 2e colonne) et l'identifiant de son document."""
    return {k: d['id'] for d in docs for g in d['g'] for x in g['l'] for k in (x['k'], x.get('k2')) if k}


# ---------- Constructions (v8) : constructions.md ----------
# Demande de l'auteur (18 oct.) : construire un tableau (bilan fonctionnel, SIG, tableau de flux, écriture…) ligne par
# ligne ; à chaque ligne, la liasse vierge s'affiche et on touche la ou les cases qui servent. Même lecture : packConstructions (02).
META_CONS = ('Thème', 'Documents', 'Unité', 'Source', 'Montants', 'Signes')
META_LIGNE = ('Cases', 'Admis', 'Résultat', 'Explication', 'Indice')
MONTANT = re.compile(r'^([A-Za-z0-9_-]+)\s*=\s*(.+)$')
CASE = re.compile(r'^([−-])?\s*(@?[A-Za-z0-9_-]+)$')
def lire_constructions(ls, nom, themes, docs, err, dec=0):
    """« ## <id> · <titre> », puis Thème, Documents (identifiants de documents.md), Unité, Source, Montants
    (« BJ = 13 822 ; BK = 3 550 », plusieurs lignes possibles), Signes (« Débit / Crédit », facultatif), les données hors
    liasse « - <id> · <libellé> · <montant> » et l'énoncé « > ». Une ligne du tableau : « ### <id> · <libellé> »,
    « Cases : BJ, − EH, @es » (− : à retrancher ; @ : une ligne déjà construite ; « aucune »), « Admis : » (cases justes
    aussi, vides ici), « Résultat : » (vérifié : la somme des cases doit tomber juste), « Explication : », « Indice : »."""
    tous, out = codes_documents(docs), []
    ld = lambda i: '%s:%d' % (nom, i + 1 + dec)
    for n, titre, d, f in blocs(ls, 2):
        ou = ld(n)
        ident, _, t = titre.partition(' · ')
        lgs = blocs(ls, 3, d, f)
        tete = lgs[0][0] if lgs else f
        m, ap, mt = {}, [], {}
        for i in range(d, tete):
            l = ls[i]
            if not l or l == '>' or l.startswith('> '): continue
            mm = meta(l, META_CONS)
            if mm and mm[0] == 'Montants':
                for p in [x.strip() for x in mm[1].split(';') if x.strip()]:
                    mo = MONTANT.match(p)
                    v = fig_nombre(mo.group(2)) if mo else None
                    if v is None: err.append(ld(i) + ' : montant attendu « <code> = <nombre> », pas « %s »' % p); continue
                    if mo.group(1) in mt: err.append(ld(i) + ' : montant de « %s » en double' % mo.group(1))
                    mt[mo.group(1)] = v
            elif mm:
                if mm[0] in m: err.append(ld(i) + ' : « %s » en double' % mm[0])
                m[mm[0]] = mm[1]
            elif l.startswith('- '):
                p = [x.strip() for x in l[2:].split(' · ')]
                v = fig_nombre(p[-1]) if len(p) > 2 else None
                x = {'k': p[0], 'p': ' · '.join(p[1:-1] if v is not None else p[1:])}
                if v is not None: x['v'] = v
                if not ID_RE.match(x['k']) or not x['p']: err.append(ld(i) + ' : donnée attendue « - <identifiant> · <libellé> · <montant> »')
                elif x['k'] in tous or any(a['k'] == x['k'] for a in ap): err.append(ld(i) + ' : « %s » existe déjà (documents ou données)' % x['k'])
                ap.append(x)
            else: err.append(ld(i) + ' : ligne non reconnue : « %s »' % l[:60])
        c = {'id': ident.strip(), 't': t.strip(), 'th': m.get('Thème', ''), 'docs': [x.strip() for x in m.get('Documents', '').split(',') if x.strip()],
             'u': m.get('Unité', ''), 'src': m.get('Source', ''), 'ctx': citation(ls, d, tete), 'mt': mt, 'ap': ap, 'l': []}
        if 'Signes' in m:
            c['sg'] = [x.strip() for x in m['Signes'].split(' / ')]
            if len(c['sg']) != 2 or not all(c['sg']): err.append(ou + ' : « Signes : <ajouté> / <retranché> » attendu (Débit / Crédit…)')
        controle_enonce(ls, d, tete, nom, err)
        ids_docs = set(x['id'] for x in docs)
        for x in c['docs']:
            if x not in ids_docs: err.append(ou + ' : document « %s » absent de documents.md' % x)
        dispo = {k: v for k, v in tous.items() if v in c['docs']}
        for k in mt:
            if k not in dispo: err.append(ou + ' : montant de « %s » : code absent des documents de la construction' % k)
        apk = dict((a['k'], a) for a in ap)
        res = {}
        for n2, t2, d2, f2 in lgs:
            o2 = ld(n2)
            lid, _, lt = t2.partition(' · ')
            sm, cle = {}, None
            for i in range(d2, f2):
                l = ls[i]
                if not l: cle = None; continue
                mm = meta(l, META_LIGNE)
                if mm:
                    if mm[0] in sm: err.append(ld(i) + ' : « %s » en double' % mm[0])
                    sm[mm[0]] = mm[1]; cle = mm[0]
                elif cle in ('Explication', 'Indice'): sm[cle] += ' ' + l.strip()
                else: err.append(ld(i) + ' : ligne non reconnue : « %s »' % l[:60])
            L = {'id': lid.strip(), 't': lt.strip(), 'c': [], 'e': sm.get('Explication', '')}
            if not ID_RE.match(L['id']): err.append(o2 + ' : identifiant de ligne « %s » invalide' % L['id'])
            elif L['id'] in res: err.append(o2 + ' : ligne « %s » en double' % L['id'])
            if not L['t']: err.append(o2 + ' : titre attendu « ### <identifiant> · <libellé> »')
            if not L['e']: err.append(o2 + ' : explication manquante (« Explication : … »)')
            if 'Cases' not in sm: err.append(o2 + ' : « Cases : » manquant (« aucune » si rien ne va dans cette ligne)')
            elif sm['Cases'].strip() != 'aucune':
                for p in [x.strip() for x in sm['Cases'].split(',')]:
                    mo = CASE.match(p)
                    if not mo: err.append(o2 + ' : case « %s » illisible' % p); continue
                    k = mo.group(2)
                    if k.startswith('@'):
                        if k[1:] not in res: err.append(o2 + ' : « %s » : aucune ligne « %s » avant celle-ci' % (k, k[1:]))
                    elif k not in dispo and k not in apk: err.append(o2 + ' : case « %s » absente des documents de la construction et des données' % k)
                    if any(x['k'] == k for x in L['c']): err.append(o2 + ' : case « %s » en double' % k)
                    L['c'].append({'k': k, 's': -1 if mo.group(1) else 1})
            if 'Admis' in sm:
                L['adm'] = [x.strip() for x in sm['Admis'].split(',') if x.strip()]
                for k in L['adm']:
                    if k not in dispo and k not in apk: err.append(o2 + ' : case admise « %s » absente des documents et des données' % k)
                    if any(x['k'] == k for x in L['c']): err.append(o2 + ' : « %s » est déjà dans « Cases : »' % k)
            if 'Indice' in sm: L['ind'] = sm['Indice']
            if 'Résultat' in sm:
                r = fig_nombre(sm['Résultat'])
                if r is None: err.append(o2 + ' : « Résultat : » doit être un nombre seul (l\'unité est celle de la construction)')
                else:
                    L['r'] = r
                    vals, manque = [], []
                    for x in L['c']:
                        k = x['k']
                        v = res.get(k[1:]) if k.startswith('@') else apk[k].get('v') if k in apk else mt.get(k)
                        if v is None: manque.append(k)
                        else: vals.append(x['s'] * v)
                    if manque: err.append(o2 + ' : montant inconnu pour %s (Montants, donnée chiffrée ou ligne avec Résultat)' % ', '.join(manque))
                    elif abs(sum(vals) - r) > fig_tol([abs(v) for v in vals] + [r]) + 1e-9:
                        err.append(o2 + ' : le résultat ne tombe pas juste : les cases donnent %s, « Résultat : » dit %s' % (fmt_fig(sum(vals)), fmt_fig(r)))
            res[L['id']] = L.get('r')
            c['l'].append(L)
        if not ID_RE.match(c['id']): err.append('%s : identifiant de construction « %s » invalide' % (ou, c['id']))
        if not c['t']: err.append(ou + ' : titre attendu « ## <identifiant> · <titre> »')
        if c['th'] not in themes: err.append(ou + ' : thème « %s » inconnu' % c['th'])
        if not c['src']: err.append(ou + ' : source manquante (« Source : … »)')
        if not c['l']: err.append(ou + ' : aucune ligne « ### <identifiant> · <libellé> »')
        if any(x['id'] == c['id'] for x in out): err.append(ou + ' : construction « %s » en double' % c['id'])
        out.append(c)
    if not out: err.append(nom + ' : aucune construction « ## <identifiant> · <titre> »')
    return out


# ---------- Une matière ----------
def lire_matiere(dossier, err, lang=None, fr=None):
    """Une matière lue depuis son dossier. i18n : avec lang (« en »…), chaque fichier est lu dans sa variante (« X.en.md »,
    « recette.en.json »…) quand elle existe, sinon dans l'original français ; fr = la matière française déjà lue (sa
    relecture sert à certifier les fiches de la variante, voir revue_langue)."""
    nom = os.path.relpath(dossier, ROOT)
    def V(*a): return var_chemin(os.path.join(dossier, *a), lang)
    p = V('recette.json')
    try: r = json.loads(lire(p))
    except ValueError as e: err.append('%s : JSON illisible (%s)' % (os.path.relpath(p, ROOT), e)); return None
    for k in ('id', 'modele', 'statut', 'titre', 'titre_h1', 'stockage'):
        if not r.get(k): err.append('%s/recette.json : champ « %s » manquant' % (nom, k))
    ag = r.get('agenda', [])
    if not (isinstance(ag, list) and all(isinstance(m, str) and m.strip() for m in ag)):
        err.append('%s/recette.json : agenda doit être une liste de mots (texte non vide)' % nom)
    if r.get('statut') not in STATUTS: err.append('%s/recette.json : statut « %s » inconnu (%s)' % (nom, r.get('statut'), ' ou '.join(STATUTS)))
    for k in ('surtitre', 'resume', 'sources'):
        if not (r.get('accueil') or {}).get(k): err.append('%s/recette.json : accueil.%s manquant' % (nom, k))
    themes = [t.get('id') for t in r.get('themes', [])]
    if len(set(themes)) != len(themes): err.append('%s/recette.json : thème en double' % nom)
    blocs_r = r.get('blocs') or {}
    ma = blocs_r.get('maitrise') or {}
    ctl = {'niv': tuple(n.get('id') for n in ma['niveaux']) if ma.get('niveaux') else NIVEAUX,
           'reg': tuple(g.get('id') for g in ma.get('regards') or [])}
    for g in ma.get('regards') or []:
        if not (g.get('id') and g.get('nom') and g.get('quoi')): err.append('%s/recette.json : maitrise.regards : « id », « nom » et « quoi » attendus' % nom)
    c = {'qcm': [], 'cas': [], 'reserve': [], 'exercices': [], 'cours': []}
    for t in r.get('themes', []):
        f = V('cours', t['id'] + '.md')
        if os.path.exists(f): c['cours'].append(lire_cours(lignes(f), os.path.relpath(f, ROOT), t['id'], err))
    for f in glob.glob(os.path.join(dossier, 'cours', '*.md')):
        if '.' in os.path.basename(f)[:-3]: continue  # variante de langue (X.en.md) : lue avec son original
        if os.path.basename(f)[:-3] not in themes: err.append('%s : thème « %s » absent de la recette' % (os.path.relpath(f, ROOT), os.path.basename(f)[:-3]))
    f = V('synthese.md')  # v10.3 : fiche de synthèse de la matière (tout le programme), même format
    if os.path.exists(f): c['synthese'] = lire_cours(lignes(f), os.path.relpath(f, ROOT), 'synthese', err)
    for t in r.get('themes', []):
        f = V('qcm', t['id'] + '.md')
        if os.path.exists(f): c['qcm'] += lire_qcm_fichier(f, t['id'], themes, t.get('nom'), err, ctl)
        elif r.get('statut') == 'prête': err.append('%s : fichier qcm/%s.md manquant' % (nom, t['id']))
    for f in glob.glob(os.path.join(dossier, 'qcm', '*.md')):
        if '.' in os.path.basename(f)[:-3]: continue
        if os.path.basename(f)[:-3] not in themes: err.append('%s : thème « %s » absent de la recette' % (os.path.relpath(f, ROOT), os.path.basename(f)[:-3]))
    for fic, cle, fn in (('cas.md', 'cas', lire_cas), ('simulation.md', 'reserve', lire_reserve), ('exercices.md', 'exercices', lire_exercices)):
        f = V(fic)
        if os.path.exists(f): c[cle] = fn(f, themes, err, ctl)
    f = V('documents.md')
    if os.path.exists(f): c['documents'] = lire_documents(lignes(f), os.path.relpath(f, ROOT), err)
    f = V('constructions.md')
    if os.path.exists(f): c['constructions'] = lire_constructions(lignes(f), os.path.relpath(f, ROOT), themes, c.get('documents', []), err)
    f = V('regles.md')
    if os.path.exists(f):
        c['claude'] = lire_regles(f, themes, err)
        regles_des_fiches(c['claude'], c['cours'], r.get('themes', []))
    elif r.get('statut') == 'prête' and blocs_r.get('aide_claude') is not False:
        err.append('%s : regles.md manquant (consignes et règles envoyées à Claude)' % nom)
    f = os.path.join(dossier, 'revue.md')
    if lang:
        if fr and fr.get('_revue'): r['_revue'] = revue_langue(fr['_revue'], c['cours'])
    elif os.path.exists(f): r['_revue'] = lire_revue(lignes(f), os.path.relpath(f, ROOT), c['cours'], err)
    calc = V('calcul.js')
    r['_calcul'] = lire(calc) if os.path.exists(calc) and (not lang or calc != os.path.join(dossier, 'calcul.js')) else None  # variante seulement
    if not lang and blocs_r.get('calcul') and not r['_calcul']: err.append('%s : bloc calcul activé sans calcul.js' % nom)
    r['contenu'] = c
    # Cohérence entre la recette et le contenu
    qids = [q['id'] for q in c['qcm']] + [s['id'] for k in c['cas'] for s in k['steps']] + [q['id'] for q in c['reserve']]
    vus = set()
    for i in qids:
        if i in vus: err.append('%s : identifiant de question en double : %s' % (nom, i))
        vus.add(i)
    eids = [e['id'] for e in c['exercices']]
    for i in set(x for x in eids if eids.count(x) > 1): err.append('%s : identifiant d\'exercice en double : %s' % (nom, i))
    for i in set(k['k'] for k in c['cas'] if [x['k'] for x in c['cas']].count(k['k']) > 1): err.append('%s : cas en double : %s' % (nom, i))
    sr = (blocs_r.get('qcm') or {}).get('serie_rapide') or {}
    for t, n in sr.items():
        dispo = len([q for q in c['qcm'] if q['th'] == t])
        if t not in themes: err.append('%s/recette.json : série rapide : thème « %s » inconnu' % (nom, t))
        elif n > dispo: err.append('%s/recette.json : série rapide : %d questions demandées en « %s », %d disponibles' % (nom, n, t, dispo))
    sim = blocs_r.get('simulation')
    if sim:
        if sim.get('cas') not in eids: err.append('%s/recette.json : simulation : exercice « %s » introuvable' % (nom, sim.get('cas')))
        if not c['reserve']: err.append('%s : simulation activée sans simulation.md (questions réservées)' % nom)
        elif sim.get('questions', 0) > len(c['reserve']): err.append('%s/recette.json : simulation : plus de questions que la réserve' % nom)
    if r.get('statut') == 'prête' and not c['qcm']: err.append('%s : matière prête sans aucune question' % nom)
    codes = set(codes_documents(c.get('documents', [])))
    for it in c['qcm'] + [s for k in c['cas'] for s in k['steps']] + c['reserve'] + c['exercices']:
        for x in it.get('rp', []) + it.get('rpa', []):
            if x not in codes: err.append('%s : %s : repère « %s » absent de documents.md' % (nom, it['id'], x))
    r['_ids'] = qids + ['ex:' + i for i in eids]
    r['_dossier'] = dossier
    return r


# ---------- Verrou des identifiants : la progression y est attachée ----------
def verrou(r, ecrire, err, infos):
    p = os.path.join(r['_dossier'], 'ids.lock')
    nom = os.path.relpath(p, ROOT)
    if not r['_ids'] and not os.path.exists(p): return
    vus = [l.strip() for l in (io.open(p, encoding='utf-8') if os.path.exists(p) else []) if l.strip() and not l.startswith('#')]
    actuels = set(r['_ids'])
    for i in vus:
        if i not in actuels:
            err.append('%s : « %s » a disparu du contenu. La progression est attachée à cet identifiant : '
                       'ne le renomme pas, corrige la question sur place. Pour la retirer vraiment, enlève aussi sa ligne du verrou.' % (nom, i))
    nouveaux = [i for i in r['_ids'] if i not in set(vus)]
    if nouveaux and ecrire and not err:
        tete = '' if os.path.exists(p) else ('# Identifiants publiés de la matière « %s ». La mémoire de révision y est attachée :\n'
                                               '# ne jamais en renommer un. L\'assemblage ajoute les nouveaux et refuse qu\'un identifiant disparaisse.\n' % r['titre'])
        io.open(p, 'a', encoding='utf-8').write(tete + ''.join(i + '\n' for i in nouveaux))
        infos.append('%s : %d identifiant(s) ajouté(s) au verrou' % (nom, len(nouveaux)))
    elif nouveaux and not ecrire:
        infos.append('%s : %d nouvel(s) identifiant(s), verrou non mis à jour (--sans-verrou)' % (nom, len(nouveaux)))


def lire_univers(base, ecrire_verrou=True):
    err, infos, out = [], [], []
    progs = sorted(glob.glob(os.path.join(base, '*', 'programme.json')))
    if not progs: err.append('%s : aucun programme (programme.json)' % base)
    for pp in progs:
        try: prog = json.loads(lire(pp))
        except ValueError as e: err.append('%s : JSON illisible (%s)' % (pp, e)); continue
        for m in prog.get('matieres', []):
            d = os.path.join(os.path.dirname(pp), m)
            if not os.path.exists(os.path.join(d, 'recette.json')): err.append('%s : matière « %s » sans recette.json' % (pp, m)); continue
            e1 = []
            r = lire_matiere(d, e1)
            if r is not None and not e1: verrou(r, ecrire_verrou, e1, infos)
            err += e1
            if r is not None:
                r['programme'] = prog.get('id')
                out.append(r)
    for cle in ('id', 'stockage'):
        vals = [r.get(cle) for r in out]
        for v in set(x for x in vals if vals.count(x) > 1): err.append('deux matières ont le même %s : %s' % (cle, v))
    if err: raise Erreurs(err)
    return out, infos


# Galaxie d'un univers (écran Univers, v5) : réglages du dessin, avec leurs bornes
GALAXIE = {'teinte': (0, 360, 200), 'bras': (1, 6, 2), 'enroulement': (0.5, 6, 3), 'inclinaison': (-3.2, 3.2, 0), 'aplatissement': (0.2, 1, 0.6)}


def lire_programmes(base, lang=None):
    """Les univers (v5) : un par programme.json, dans l'ordre des dossiers. Le premier est l'univers par défaut.
    i18n : avec lang, la variante « programme.en.json » (seuls les programmes qui en ont une sont rendus) ; elle doit
    avoir les mêmes id et la même liste de matières que l'original (forme)."""
    err, out = [], []
    for po in sorted(glob.glob(os.path.join(base, '*', 'programme.json'))):
        pp = var_chemin(po, lang)
        if lang and pp == po: continue
        try: prog = json.loads(lire(pp))
        except ValueError as e:
            if lang: err.append('%s : JSON illisible (%s)' % (os.path.relpath(pp, ROOT), e))
            continue  # (l'original : déjà signalé par lire_univers)
        if lang:
            try: forme(json.loads(lire(po)), prog, os.path.relpath(pp, ROOT), err, fixes=FORME_PROG)
            except ValueError: pass
        i = prog.get('id')
        if not isinstance(i, str) or not ID_RE.match(i): err.append('%s : « id » manquant ou invalide' % pp); continue
        if not isinstance(prog.get('nom'), str) or not prog['nom'].strip(): err.append('%s : « nom » manquant' % pp)
        g, gs = {}, prog.get('galaxie') or {}
        if not isinstance(gs, dict): err.append('%s : « galaxie » doit être un objet' % pp); gs = {}
        for k, (lo, hi, d) in GALAXIE.items():
            v = gs.get(k, d)
            if not isinstance(v, (int, float)) or isinstance(v, bool) or not lo <= v <= hi:
                err.append('%s : galaxie.%s doit être un nombre entre %s et %s' % (pp, k, lo, hi)); v = d
            g[k] = v
        for k in gs:
            if k not in GALAXIE: err.append('%s : galaxie.%s inconnu (réglages : %s)' % (pp, k, ', '.join(sorted(GALAXIE))))
        u = {'id': i, 'nom': prog.get('nom', i), 'description': prog.get('description', ''), 'galaxie': g,
             'libelle': prog.get('libelle_matieres', 'matières'), 'vide': prog.get('vide', ''), 'matieres': []}
        for k in ('description', 'libelle', 'vide'):
            if not isinstance(u[k], str): err.append('%s : « %s » doit être un texte' % (pp, k))
        out.append(u)
    ids = [u['id'] for u in out]
    for v in set(x for x in ids if ids.count(x) > 1): err.append('deux programmes ont le même id : %s' % v)
    if err: raise Erreurs(err)
    return out


# ---------- Langues (i18n) ----------
# Interface : src/i18n/<langue>/*.json (tables plates {clé: texte}, une langue = un dossier ; « fr » est la référence).
# Contenu : à côté de chaque fichier de univers/, sa variante « X.<langue>.<ext> » (X.en.md, recette.en.json,
# programme.en.json, calcul.en.js), de même structure ; docs/modele-de-pack.<langue>.md et modeles/exemple-pack.<langue>.md.
# Une matière sans variante reste en français. La progression est indexée par identifiant : mêmes identifiants, mêmes
# bonnes réponses dans toutes les langues (contrôlé par forme() ci-dessous), donc rien ne bouge quand on change de langue.
LANGUE_DEFAUT = 'fr'
I18N_DIR = os.path.join(ROOT, 'src', 'i18n')
I18N_CLE = re.compile(r'^[a-z0-9_]+(\.[a-z0-9_]+)+$')
I18N_LANG = re.compile(r'^[a-z]{2,3}$')
I18N_VAR = re.compile(r'\{(\w+)\}')
# t("clé"…) tn("clé", n…) tx("clé"…) tnx("clé", n…) : tx et tnx sont les mêmes fonctions, pour les fonctions qui ont une variable locale « t »
I18N_APPEL = re.compile(r"""(?<![\w$.])(tnx|tn|tx|t)\(\s*(?:"([^"\\\n]*)"|'([^'\\\n]*)')\s*[,)]""")
I18N_ATTR = re.compile(r'\bdata-i18n(?:-aria|-ph|-title)?="([^"]*)"')
FORME_PROG = {'id', 'matieres'}
FORME_RECETTE = {'id', 'modele', 'statut', 'stockage', 'cas', 'th', 'theme', 'programme'}
FIG_OUVRE = re.compile(r'^:::[ \t]+(\S+)', re.M)
_I18N = {}


def var_chemin(p, lang):
    """La variante de langue d'un fichier (X.md → X.en.md) si elle existe, sinon le fichier lui-même."""
    if not lang: return p
    base, ext = os.path.splitext(p)
    v = '%s.%s%s' % (base, lang, ext)
    return v if os.path.exists(v) else p


def lire_i18n():
    """Les tables de l'interface : ({langue: {clé: texte}}, {langue: {clé: fichier}}), contrôlées. Arrêt au moindre problème."""
    if _I18N: return _I18N['t'], _I18N['o']
    err, tables, ou = [], {}, {}
    if not os.path.isdir(I18N_DIR): raise Erreurs(['%s : dossier des traductions absent' % os.path.relpath(I18N_DIR, ROOT)])
    def pairs(lst):
        d = {}
        for k, v in lst:
            if k in d: raise ValueError('clé « %s » en double dans le fichier' % k)
            d[k] = v
        return d
    for l in sorted(os.listdir(I18N_DIR)):
        d = os.path.join(I18N_DIR, l)
        if not os.path.isdir(d): continue
        if not I18N_LANG.match(l): err.append('%s : nom de langue invalide (2 ou 3 lettres : fr, en, de…)' % os.path.relpath(d, ROOT)); continue
        tables[l], ou[l] = {}, {}
        for f in sorted(glob.glob(os.path.join(d, '*.json'))):
            nom = os.path.relpath(f, ROOT)
            try: o = json.loads(lire(f), object_pairs_hook=pairs)
            except ValueError as e: err.append('%s : JSON illisible (%s)' % (nom, e)); continue
            if not isinstance(o, dict): err.append('%s : un objet plat {"clé": "texte"} est attendu' % nom); continue
            for k, v in o.items():
                if k.startswith('_'): continue  # commentaires
                if not I18N_CLE.match(k): err.append('%s : clé « %s » invalide (« zone.sujet », minuscules, chiffres et _)' % (nom, k)); continue
                if not isinstance(v, str): err.append('%s : « %s » : un texte est attendu' % (nom, k)); continue
                if k in tables[l]: err.append('%s : clé « %s » déjà définie dans %s' % (nom, k, ou[l][k])); continue
                tables[l][k] = v; ou[l][k] = nom
    if LANGUE_DEFAUT not in tables: err.append('src/i18n/%s : langue de référence absente' % LANGUE_DEFAUT)
    else:
        ref = tables[LANGUE_DEFAUT]
        for l, tb in tables.items():
            if l == LANGUE_DEFAUT: continue
            dd = os.path.join('src', 'i18n', l)
            for k in sorted(set(ref) - set(tb)): err.append('%s : clé « %s » absente (définie dans %s)' % (dd, k, ou[LANGUE_DEFAUT][k]))
            for k in sorted(set(tb) - set(ref)): err.append('%s : clé « %s » absente de la langue de référence « %s »' % (ou[l][k], k, LANGUE_DEFAUT))
            for k in sorted(set(ref) & set(tb)):
                a, b = set(I18N_VAR.findall(ref[k])), set(I18N_VAR.findall(tb[k]))
                if a != b: err.append('%s : clé « %s » : variables %s au lieu de %s (comme %s)' % (ou[l][k], k, sorted(b) or 'aucune', sorted(a) or 'aucune', LANGUE_DEFAUT))
        for l, tb in tables.items():
            for k in tb:
                if k.endswith('.one') and k[:-4] + '.other' not in tb: err.append('%s : clé « %s » sans « %s.other »' % (ou[l][k], k, k[:-4]))
                if k.endswith('.other') and k[:-6] + '.one' not in tb: err.append('%s : clé « %s » sans « %s.one »' % (ou[l][k], k, k[:-6]))
        if 'langue.nom' not in ref: err.append('src/i18n/%s : clé « langue.nom » (le nom de la langue, dans sa langue) manquante' % LANGUE_DEFAUT)
        if 'langue.locale' not in ref: err.append('src/i18n/%s : clé « langue.locale » (fr-FR, en-GB…) manquante' % LANGUE_DEFAUT)
        # chaque appel littéral du code (et chaque data-i18n du HTML) existe dans la table de référence
        vus = set()
        def utilise(k, fn, ou_):
            if fn in ('tn', 'tnx'):
                for suf in ('.one', '.other'):
                    if k + suf not in ref: err.append('%s : %s("%s", …) : clé « %s%s » absente de src/i18n/%s' % (ou_, fn, k, k, suf, LANGUE_DEFAUT))
                    vus.add(k + suf)
            elif k not in ref: err.append('%s : %s("%s") : clé absente de src/i18n/%s' % (ou_, fn, k, LANGUE_DEFAUT))
            else: vus.add(k)
        for pj in sorted(glob.glob(os.path.join(ROOT, 'src', 'js', '*.js'))):
            tx_ = re.sub(r'/\*.*?\*/', lambda m: re.sub(r'[^\n]', ' ', m.group(0)), lire(pj), flags=re.S)  # les commentaires ne comptent pas (lignes gardées)
            for m in I18N_APPEL.finditer(tx_):
                utilise(m.group(2) if m.group(2) is not None else m.group(3), m.group(1), '%s:%d' % (os.path.relpath(pj, ROOT), tx_.count('\n', 0, m.start()) + 1))
        ph = os.path.join(ROOT, 'src', 'body.html')
        if os.path.exists(ph):
            tx_ = lire(ph)
            for m in I18N_ATTR.finditer(tx_):
                utilise(m.group(1), 'data-i18n', '%s:%d' % (os.path.relpath(ph, ROOT), tx_.count('\n', 0, m.start()) + 1))
        _I18N['inutilisees'] = len([k for k in ref if k not in vus])
    if err: raise Erreurs(err)
    _I18N['t'], _I18N['o'] = tables, ou
    return tables, ou


def langues_i18n():
    """Les langues de l'interface, la référence d'abord."""
    t = lire_i18n()[0]
    return [LANGUE_DEFAUT] + sorted(l for l in t if l != LANGUE_DEFAUT)


def forme(a, b, ou, err, libre=None, fixes=None, chemin='', cle=None):
    """Compare la forme de deux structures lues (original et variante de langue) : mêmes champs, mêmes longueurs de listes,
    mêmes nombres et booléens ; une chaîne doit être la même sauf si elle est du texte libre (clé dans « libre », ou, avec
    « fixes », toute clé qui n'est pas dans « fixes »). Les figures et encadrés (« ::: type ») d'un texte libre doivent
    être les mêmes, dans le même ordre."""
    if isinstance(a, dict):
        if not isinstance(b, dict): err.append('%s : %s : un objet est attendu, comme dans l\'original' % (ou, chemin or '(racine)')); return
        for k in sorted(set(a) - set(b)): err.append('%s : %s : champ « %s » absent (présent dans l\'original)' % (ou, chemin or '(racine)', k))
        for k in sorted(set(b) - set(a)): err.append('%s : %s : champ « %s » en trop (absent de l\'original)' % (ou, chemin or '(racine)', k))
        for k in a:
            if k in b: forme(a[k], b[k], ou, err, libre, fixes, '%s.%s' % (chemin, k) if chemin else k, k)
    elif isinstance(a, list):
        if not isinstance(b, list) or len(a) != len(b):
            err.append('%s : %s : %s éléments attendus (comme dans l\'original), %s trouvés' % (ou, chemin, len(a), len(b) if isinstance(b, list) else '?')); return
        for i, (x, y) in enumerate(zip(a, b)): forme(x, y, ou, err, libre, fixes, '%s[%d]' % (chemin, i), cle)
    elif isinstance(a, str):
        if not isinstance(b, str): err.append('%s : %s : un texte est attendu' % (ou, chemin)); return
        libre_ = (cle not in fixes) if fixes is not None else (cle in (libre or ()))
        if not libre_:
            if a != b: err.append('%s : %s : « %s » dans l\'original, « %s » ici (doit être identique)' % (ou, chemin, a[:40], b[:40]))
        elif cle in ('ctx', 'md'):
            fa, fb = FIG_OUVRE.findall(a), FIG_OUVRE.findall(b)
            if fa != fb: err.append('%s : %s : figures et encadrés « ::: » à garder, dans le même ordre (original : %s ; ici : %s)' % (ou, chemin, ', '.join(fa) or 'aucun', ', '.join(fb) or 'aucun'))
    elif isinstance(a, bool) != isinstance(b, bool) or a != b:
        err.append('%s : %s : %r dans l\'original, %r ici (doit être identique)' % (ou, chemin, a, b))


LIBRE_QCM = {'q', 'o', 'd', 'e', 's', 'ctx'}
LIBRE_EX = {'t', 'ctx', 'src', 'tl'}
LIBRE_SUB = {'q', 'sol', 'm', 'ind', 'u'}
LIBRE_DOC = {'t', 'src', 'intro', 'p', 'u', 'col'}
LIBRE_CONS = {'t', 'u', 'src', 'ctx', 'e', 'ind', 'p', 'sg'}


def parite_matiere(fr, en, err, lang):
    """La variante de langue d'une matière a les mêmes thèmes, questions, cas, exercices, bonnes réponses, repères,
    figures et documents que l'original : la progression (attachée aux identifiants) ne change pas avec la langue."""
    nom = os.path.relpath(en['_dossier'], ROOT)
    ou = lambda f: '%s/%s' % (nom, f.replace('<langue>', lang))
    rf, re_ = {k: v for k, v in fr.items() if not k.startswith('_') and k != 'contenu'}, {k: v for k, v in en.items() if not k.startswith('_') and k != 'contenu'}
    forme(rf, re_, ou('recette.<langue>.json'), err, fixes=FORME_RECETTE)
    cf, ce = fr['contenu'], en['contenu']
    for th in set(x['th'] for x in cf['qcm']) | set(x['th'] for x in ce['qcm']):
        qa, qb = [x for x in cf['qcm'] if x['th'] == th], [x for x in ce['qcm'] if x['th'] == th]
        parite_questions(qa, qb, ou('qcm/%s.<langue>.md' % th), err)
    parite_questions(cf['reserve'], ce['reserve'], ou('simulation.<langue>.md'), err)
    ca, cb = [k['k'] for k in cf['cas']], [k['k'] for k in ce['cas']]
    if ca != cb: err.append('%s : cas %s attendus (comme l\'original), trouvés %s' % (ou('cas.<langue>.md'), ca, cb))
    else:
        for x, y in zip(cf['cas'], ce['cas']):
            forme({k: v for k, v in x.items() if k != 'steps'}, {k: v for k, v in y.items() if k != 'steps'}, ou('cas.<langue>.md') + ' (%s)' % x['k'], err, libre={'n', 'ctx'})
            parite_questions(x['steps'], y['steps'], ou('cas.<langue>.md') + ' (%s)' % x['k'], err)
    ea, eb = [x['id'] for x in cf['exercices']], [x['id'] for x in ce['exercices']]
    if ea != eb: err.append('%s : exercices %s attendus (comme l\'original), trouvés %s' % (ou('exercices.<langue>.md'), ea, eb))
    else:
        for x, y in zip(cf['exercices'], ce['exercices']):
            o2 = ou('exercices.<langue>.md') + ' (%s)' % x['id']
            forme({k: v for k, v in x.items() if k != 'subs'}, {k: v for k, v in y.items() if k != 'subs'}, o2, err, libre=LIBRE_EX)
            forme(x['subs'], y['subs'], o2, err, libre=LIBRE_SUB, chemin='subs')
    ta, tb = [x['th'] for x in cf['cours']], [x['th'] for x in ce['cours']]
    if ta != tb: err.append('%s : fiches %s attendues (comme l\'original), trouvées %s' % (ou('cours'), ta, tb))
    else:
        for x, y in zip(cf['cours'], ce['cours']):
            o2 = ou('cours/%s.<langue>.md' % x['th'])
            forme(x, y, o2, err, libre={'t', 'md', 'src', 'intro', 'av'})
            for sa, sb in zip(x['sections'], y['sections']):
                if (sa['t'] in ESSENTIEL or sa['t'] in A_RETENIR) and sa['t'] != sb['t']:
                    err.append('%s : la section « %s » garde son titre français (mot-clé de syntaxe), pas « %s »' % (o2, sa['t'], sb['t']))
    if ('synthese' in cf) != ('synthese' in ce): err.append('%s : synthèse présente dans une seule des deux langues' % ou('synthese.<langue>.md'))
    elif 'synthese' in cf: forme(cf['synthese'], ce['synthese'], ou('synthese.<langue>.md'), err, libre={'t', 'md', 'src', 'intro', 'av'})
    if cf.get('documents') or ce.get('documents'): forme(cf.get('documents', []), ce.get('documents', []), ou('documents.<langue>.md'), err, libre=LIBRE_DOC)
    if cf.get('constructions') or ce.get('constructions'): forme(cf.get('constructions', []), ce.get('constructions', []), ou('constructions.<langue>.md'), err, libre=LIBRE_CONS)
    if set((cf.get('claude') or {}).get('regles', {})) != set((ce.get('claude') or {}).get('regles', {})):
        err.append('%s : règles par thème différentes de l\'original' % ou('regles.<langue>.md'))


def parite_questions(qa, qb, ou, err):
    ia, ib = [q['id'] for q in qa], [q['id'] for q in qb]
    if ia != ib:
        err.append('%s : questions %s attendues (comme l\'original, même ordre), trouvées %s' % (ou, ', '.join(ia), ', '.join(ib))); return
    for x, y in zip(qa, qb):
        forme(x, y, '%s (%s)' % (ou, x['id']), err, libre=LIBRE_QCM)
        if x.get('t') != y.get('t'): err.append('%s (%s) : « Type : » %s dans l\'original, %s ici' % (ou, x['id'], x.get('t'), y.get('t')))


def revue_langue(rv, cours):
    """La relecture d'une matière pour sa variante de langue : une fiche anglaise est certifiée si sa jumelle française
    l'est. L'empreinte d'une fiche (FNV-1a de son texte) change avec la langue ; la relecture (revue.md) juge la fiche
    française, dont l'anglaise est la traduction fidèle (mêmes parties, mêmes figures, contrôlé par forme()). On reporte
    donc, pour chaque fiche à jour de l'original, l'empreinte du texte de la variante ; une fiche périmée garde l'empreinte
    périmée de l'original (donc reste non certifiée), comme une fiche non relue."""
    out = {'date': rv['date'], 'par': rv['par'], 'fiches': {}, 'perimees': list(rv.get('perimees', []))}
    par_th = dict((c['th'], c) for c in cours)
    for th, x in rv['fiches'].items():
        y = {'h': x['h'], 'v': x['v']}
        if th in par_th and th not in rv.get('perimees', []): y['h'] = empreinte(par_th[th])
        out['fiches'][th] = y
    return out


def lire_univers_langue(base, fr_recettes, lang):
    """Les variantes de langue des matières (celles qui ont au moins un fichier « *.<lang>.* ») : (recettes, infos)."""
    err, out, infos = [], [], []
    for r in fr_recettes:
        d = r['_dossier']
        vs = [f for f in glob.glob(os.path.join(d, '**', '*.%s.*' % lang), recursive=True) if os.path.isfile(f)]
        if not vs: continue
        for f in vs:  # une variante sans original est une faute de frappe
            b, e = os.path.splitext(f)
            if not os.path.exists(b[:-len(lang) - 1] + e): err.append('%s : pas de fichier original « %s »' % (os.path.relpath(f, ROOT), os.path.basename(b[:-len(lang) - 1] + e)))
        e1 = []
        rl = lire_matiere(d, e1, lang, r)
        if rl is not None and not e1:
            rl['programme'] = r.get('programme')
            parite_matiere(r, rl, e1, lang)
            if not e1: infos.append('%s : variante « %s » lue et conforme (%d fichier(s))' % (os.path.relpath(d, ROOT), lang, len(vs)))
        err += e1
        if rl is not None: out.append(rl)
    if err: raise Erreurs(err)
    return out, infos


def contenu_langues(univers, recettes, vierge):
    """Pour chaque langue autre que la référence : {recettes, univers, revues, calculs, modele, exemple} (voir fragment_contenu)."""
    res, infos = {}, []
    for l in langues_i18n()[1:]:
        rl, inf = ([], []) if vierge else lire_univers_langue(univers, recettes, l)
        infos += inf
        us = [] if vierge else lire_programmes(univers, l)
        def doc(p):
            f = os.path.join(ROOT, *p.split('/'))
            b, e = os.path.splitext(f)
            f = '%s.%s%s' % (b, l, e)
            return lire(f) if os.path.exists(f) else None
        res[l] = {'recettes': rl, 'univers': us, 'modele': doc('docs/modele-de-pack.md'), 'exemple': doc('modeles/exemple-pack.md')}
    return res, infos



# ---------- Packs de cours (v7) : une matière entière dans un seul texte ----------
# Format dans univers/README.md (« Packs ») ; la consigne à donner à une IA est docs/modele-de-pack.md.
# L'app lit un pack sans build.py (src/js/02-packs.js) ; build.py en écrit un par matière prête (dist/packs/) et
# range un pack dans univers/ (--depaqueter). Le calcul mental (calcul.js, du code) ne voyage pas dans un pack.
PACK_FICHIERS = (('cas.md', 'Cas', 'Cas pratiques en étapes'), ('exercices.md', 'Exercices', 'Exercices rédigés'),
                 ('simulation.md', 'Simulation', 'Questions réservées à la simulation'), ('documents.md', 'Documents', 'Documents types'),
                 ('constructions.md', 'Constructions', 'Constructions'),
                 ('regles.md', 'Règles', 'Aide de l\'IA'))
PACK_TETE = ('Titre', 'Identifiant', 'Univers', 'Surtitre', 'Résumé', 'Sources', 'Agenda', 'Thème', 'Regard', 'Mise à jour')


def sans_titre(texte, nom):
    """Un fichier de contenu dans un pack : sans son titre « # … » (les sections du pack en tiennent lieu)."""
    ls = texte.rstrip('\n').split('\n')
    if ls and ls[0].startswith('# '): ls = ls[1:]
    for l in ls:
        if l.startswith('# ') or l.startswith('```'): raise Erreurs(['%s : « %s » ne peut pas aller dans un pack' % (nom, l[:40])])
    return '\n'.join(ls).strip('\n')


def pack_texte(r):
    """Le pack d'une matière lue par lire_matiere : la recette entière en JSON, puis ses fichiers, section par section."""
    d = r['_dossier']
    out = ['# Pack · ' + r['titre'], '', 'Univers : ' + (r.get('programme') or ''), '', '```json',
           lire(os.path.join(d, 'recette.json')).strip(), '```']
    for t in r.get('themes', []):
        f = os.path.join(d, 'qcm', t['id'] + '.md')
        if os.path.exists(f): out += ['', '# QCM · ' + t['id'], '', sans_titre(lire(f), f)]
    for t in r.get('themes', []):
        f = os.path.join(d, 'cours', t['id'] + '.md')
        if os.path.exists(f): out += ['', '# Cours · ' + t['id'], '', sans_titre(lire(f), f)]
    f = os.path.join(d, 'synthese.md')
    if os.path.exists(f): out += ['', '# Synthèse', '', sans_titre(lire(f), f)]
    for fic, sec, _t in PACK_FICHIERS:
        f = os.path.join(d, fic)
        if os.path.exists(f): out += ['', '# ' + sec, '', sans_titre(lire(f), f)]
    return '\n'.join(out + ['', '# Fin du pack', ''])


META_TOUTES = set(META_QCM + META_EX + META_SUB + PACK_TETE + META_CONS + META_LIGNE + ('Thèmes', 'Introduction'))
def norm_ligne(l):
    """Une ligne de pack écrite à peu près au format (« Clé: valeur », « **Clé :** valeur », espace insécable, « * [x] »)
    devient exactement au format. Même règle dans l'app (packNormLigne, src/js/02-packs.js)."""
    l = re.sub(r'[\u00a0\u202f]:', ' :', l)
    m = re.match(r'^\*\*([^*:]{1,30}?)\s*:\s*\*\*\s*(.*)$', l)
    if m and m.group(1).strip() in META_TOUTES: return m.group(1).strip() + ' : ' + m.group(2)
    m = re.match(r'^([^:]{1,30}?)\s*:\s+(.*)$', l)
    if m and m.group(1).strip() in META_TOUTES and not l.startswith(m.group(1).strip() + ' : '): return m.group(1).strip() + ' : ' + m.group(2)
    m = re.match(r'^\* \[( |x|X)\] (.*)$', l)
    return '- [%s] %s' % (m.group(1), m.group(2)) if m else l


def slug(s):
    import unicodedata
    s = ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def recette_de_pack(texte):
    """En-tête et sections d'un pack. Mêmes règles que packLire (src/js/02-packs.js) : le bloc JSON d'abord,
    les lignes « Clé : valeur » par-dessus, puis les valeurs par défaut. Renvoie (recette, programme, sections)."""
    ls = [l.rstrip() for l in texte.replace('\r\n', '\n').split('\n')]
    ls = [norm_ligne(l) for l in ls]
    deb = next((i for i, l in enumerate(ls) if re.match(r'^# Pack( · |$)', l)), None)
    if deb is None: raise Erreurs(['pack : la ligne « # Pack · <titre> » est introuvable'])
    secs, tete, js, dans_js, fence = [], [], [], False, False
    for l in ls[deb + 1:]:
        if l.startswith('```'):
            fence = not fence
            if not secs: dans_js = fence and 'json' in l; continue
        if not fence and l.startswith('# '):
            if l.strip() in ('# Fin du pack', '# Fin'): break
            secs.append((l[2:].strip(), [])); continue
        if fence and dans_js and not secs: js.append(l)
        elif secs: secs[-1][1].append(l)
        else: tete.append(l)
    r = json.loads('\n'.join(js)) if js else {}
    acc = r.setdefault('accueil', {})
    themes, regards, prog = [], [], None
    for l in tete:
        mm = meta(l, PACK_TETE)
        if not mm: continue
        k, v = mm
        if k == 'Titre': r['titre'] = v
        elif k == 'Identifiant': r['id'] = v
        elif k == 'Univers': prog = v
        elif k == 'Surtitre': acc['surtitre'] = v
        elif k == 'Résumé': acc['resume'] = v
        elif k == 'Sources': acc['sources'] = v
        elif k == 'Agenda': r['agenda'] = [x.strip() for x in v.split(',') if x.strip()]
        elif k == 'Thème':
            i, _, n = v.partition(' · '); themes.append({'id': i.strip(), 'nom': n.strip()})
        elif k == 'Regard':
            p = [x.strip() for x in v.split(' · ')]; regards.append({'id': p[0], 'nom': p[1] if len(p) > 1 else '', 'quoi': p[2] if len(p) > 2 else ''})
    if themes: r['themes'] = themes
    if regards: r.setdefault('blocs', {}).setdefault('maitrise', {})['regards'] = regards
    r.setdefault('titre', '')
    r.setdefault('id', slug(r['titre']))
    r.setdefault('modele', 'matiere-de-cours'); r.setdefault('statut', 'prête'); r.setdefault('titre_h1', r['titre'])
    r.setdefault('stockage', 'qfcc2.pk.' + r['id'] + '.')
    acc.setdefault('surtitre', 'Cours importé'); acc.setdefault('resume', 'Pack de cours importé')
    acc.setdefault('sources', 'Sources : les documents donnés à l\'IA pour ce pack.')
    return r, prog, secs


def depaqueter(chemin, dossier):
    """Range un pack dans univers/<programme>/<matière>/ (fichiers lisibles), pour l'assembler ensuite comme les autres."""
    r, _p, secs = recette_de_pack(lire(chemin))
    noms = {t.get('id'): t.get('nom', '') for t in r.get('themes', [])}
    os.makedirs(os.path.join(dossier, 'qcm'), exist_ok=True)
    titres = {sec: (fic, t) for fic, sec, t in PACK_FICHIERS}
    for titre, ls in secs:
        corps = '\n'.join(ls).strip('\n') + '\n'
        q, k = re.match(r'^QCM · (.+)$', titre), re.match(r'^Cours · (.+)$', titre)
        if k:
            os.makedirs(os.path.join(dossier, 'cours'), exist_ok=True)
            io.open(os.path.join(dossier, 'cours', k.group(1).strip() + '.md'), 'w', encoding='utf-8').write(corps)
        elif titre == 'Synthèse': io.open(os.path.join(dossier, 'synthese.md'), 'w', encoding='utf-8').write(corps)
        elif q: io.open(os.path.join(dossier, 'qcm', q.group(1).strip() + '.md'), 'w', encoding='utf-8').write('# %s\n\n%s' % (noms.get(q.group(1).strip(), q.group(1)), corps))
        elif titre in titres: io.open(os.path.join(dossier, titres[titre][0]), 'w', encoding='utf-8').write('# %s\n\n%s' % (titres[titre][1], corps))
        else: raise Erreurs(['%s : section « # %s » inconnue (QCM · <thème>, Cours · <thème>, Synthèse, %s)' % (chemin, titre, ', '.join(s for _f, s, _t in PACK_FICHIERS))])
    # Consignes de l'aide absentes du pack : celles par défaut, comme dans l'app (PACK_CONSIGNES)
    rp = os.path.join(dossier, 'regles.md')
    texte = lire(rp) if os.path.exists(rp) else '# Aide de l\'IA\n'
    defaut = lire(os.path.join(ROOT, 'modeles', 'consignes-par-defaut.md')).split('\n## ')[1:]
    manque = ['## ' + c.strip() + '\n' for c in defaut if ('\n## ' + c.split('\n')[0]) not in '\n' + texte]
    if manque:
        tete, _, reste = texte.partition('\n## ')
        io.open(rp, 'w', encoding='utf-8').write(tete.rstrip('\n') + '\n\n' + '\n'.join(manque) + ('\n## ' + reste if reste else ''))
    io.open(os.path.join(dossier, 'recette.json'), 'w', encoding='utf-8').write(json.dumps(r, ensure_ascii=False, indent=2) + '\n')
    print('%s : pack rangé (%d sections). Ajoute « %s » aux matières de programme.json, puis assemble.' % (os.path.relpath(dossier, ROOT), len(secs), os.path.basename(dossier)))


# ---------- L'app (v13) : ce qui est propre à la personne, hors du code ----------
# univers/app.json : nom (titre de la page), eleve (prénom donné à l'IA dans ses demandes), contexte (qui il est, pour
# l'IA). Sans ce fichier : « Révisions », et l'IA lit le prénom du profil (sinon « l'élève »). Maitrise : nom « Maitrise »,
# vierge (aucun contenu, première configuration).
APP_DEFAUT = {'nom': 'Révisions', 'vierge': False, 'eleve': '', 'contexte': ''}


def lire_app(base):
    a = dict(APP_DEFAUT)
    p = os.path.join(base, 'app.json')
    if not os.path.exists(p): return a
    try: o = json.loads(lire(p))
    except ValueError as e: raise Erreurs(['%s : JSON illisible (%s)' % (os.path.relpath(p, ROOT), e)])
    for k in ('nom', 'eleve', 'contexte'):
        if k in o:
            if not isinstance(o[k], str) or (k == 'nom' and not o[k].strip()):
                raise Erreurs(['%s : « %s » doit être un texte%s' % (os.path.relpath(p, ROOT), k, ' non vide' if k == 'nom' else '')])
            a[k] = o[k].strip()
    for k in o:
        if k not in ('nom', 'eleve', 'contexte'): raise Erreurs(['%s : « %s » inconnu (nom, eleve, contexte)' % (os.path.relpath(p, ROOT), k)])
    return a


def donnees(recettes, progs, app):
    """Le contenu du dépôt au format d'échange (docs/format-donnees.md), sans progression : à importer dans Maitrise."""
    us = [{'id': u['id'], 'nom': u['nom'], 'description': u['description'], 'libelle': u['libelle'], 'vide': u['vide'],
           'galaxie': u['galaxie']} for u in progs]
    sy = [{'id': r['id'], 'univers': r.get('programme'), 'nom': r['titre'], 'stockage': r['stockage'],
           'planetes': [{'id': t['id'], 'nom': t.get('nom', '')} for t in r.get('themes', [])],
           'pack': pack_texte(r) if r.get('statut') == 'prête' else None,
           'revue': {k: r['_revue'][k] for k in ('date', 'par', 'fiches')} if r.get('_revue') else None} for r in recettes]
    return json.dumps({'app': 'maitrise', 'format': 1, 'cree': None, 'source': app['nom'], 'univers': us, 'systemes': sy,
                       'progression': {'cles': {}}}, ensure_ascii=False, indent=1) + '\n'


def fragment_contenu(recettes, univers=None, app=None, packs=None, langues=None):
    """Le contenu en JavaScript : RECETTES (données), CALCULS (générateurs du calcul mental, code de la matière)
    et UNIVERS (v5 : un par programme, avec ses matières dans l'ordre). v7 : PACK_CONSIGNES (consignes de l'aide pour
    un pack importé qui n'en apporte pas) et MODELE_PACK (la consigne à donner à une IA, copiée depuis l'app)."""
    pub = [{k: v for k, v in r.items() if not k.startswith('_')} for r in recettes]
    us = [dict(u, matieres=[r['id'] for r in recettes if r.get('programme') == u['id']]) for u in (univers or [])]
    def enjs(o):
        js = json.dumps(o, ensure_ascii=False, separators=(',', ':'))
        return js.replace('</', '<\\/').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    err = []
    cons = lire_regles(os.path.join(ROOT, 'modeles', 'consignes-par-defaut.md'), [], err)
    if err: raise Erreurs(err)
    out = '/* ---------- Contenu des matières : généré par build.py depuis univers/, ne pas modifier ici ---------- */\n'
    out += 'var RECETTES=' + enjs(pub) + ';\nvar UNIVERS=' + enjs(us) + ';\nvar CALCULS={};\n'
    # v13 : l'app (univers/app.json) et le texte du pack de chaque matière prête, pour « Tout exporter » (12m)
    out += 'var APP=' + enjs(app or APP_DEFAUT) + ';\nvar PACKS_TEXTE=' + enjs(packs or {}) + ';\n'
    out += 'var PACK_CONSIGNES=' + enjs({k: cons[k] for k in ('instr', 'exq', 'corr')}) + ';\n'
    out += 'var MODELE_PACK=' + enjs(lire(os.path.join(ROOT, 'docs', 'modele-de-pack.md'))) + ';\n'
    # Le cours d'exemple du guide (modeles/exemple-pack.md) : l'app le lit avec le vrai lecteur de packs, pour simuler un import
    out += 'var PACK_EXEMPLE=' + enjs(lire(os.path.join(ROOT, 'modeles', 'exemple-pack.md'))) + ';\n'
    # i18n : les tables de l'interface (src/i18n/<langue>/) et, par langue autre que le français, les variantes du contenu
    # (recettes, textes des univers, relectures, calcul mental, consigne de pack et cours d'exemple) ; 00-i18n.js les met en place
    out += 'var I18N=' + enjs(lire_i18n()[0]) + ';\nvar I18N_LANGS=' + enjs(langues_i18n()) + ';\n'
    cl = {}
    for l, d in (langues or {}).items():
        cl[l] = {'recettes': [{k: v for k, v in r.items() if not k.startswith('_')} for r in d['recettes']],
                 'univers': [{k: u[k] for k in ('id', 'nom', 'description', 'libelle', 'vide')} for u in d['univers']],
                 'revues': dict((r['id'], {k: r['_revue'][k] for k in ('date', 'par', 'fiches')}) for r in d['recettes'] if r.get('_revue')),
                 'modele': d['modele'], 'exemple': d['exemple'], 'calculs': {}}
    out += 'var CONTENU_LANG=' + enjs(cl) + ';\n'
    for l, d in (langues or {}).items():
        for r in d['recettes']:
            if r['_calcul']: out += 'CONTENU_LANG[%s].calculs[%s]=function(){\n%s\n};\n' % (json.dumps(l), json.dumps(r['id']), r['_calcul'].rstrip())
    # v7.4 : relectures des fiches (revue.md) et critères de la grille. Hors des recettes : un pack ne les emporte pas.
    rv = dict((r['id'], {k: r['_revue'][k] for k in ('date', 'par', 'fiches')}) for r in recettes if r.get('_revue'))
    out += 'var REVUES=' + enjs(rv) + ';\nvar GRILLE=' + enjs([{'k': k, 'f': f, 'n': n, 'q': q} for k, f, n, q in GRILLE]) + ';\n'
    for r in recettes:
        if r['_calcul']:
            out += 'CALCULS[%s]=function(){\n%s\n};\n' % (json.dumps(r['id']), r['_calcul'].rstrip())
    return out


# v7.1 : la bonne réponse ne doit pas se deviner à sa longueur (Haladyna, Downing et Rodriguez, 2002). Un avis, pas une
# erreur : même calcul que packBiais (02), qui avertit à l'import d'un pack.
BIAIS_SEUIL = 0.4


def biais_longueur(r):
    c = r['contenu']
    qs = c['qcm'] + [s for k in c['cas'] for s in k['steps']] + c['reserve']
    qs = [q for q in qs if len(q['o']) > 1 and not q.get('t')]
    n = 0
    for q in qs:
        L = [len(o) for o in q['o']]
        if L[q['c']] == max(L) and L.count(max(L)) == 1: n += 1
    return n, len(qs)


def assembler(univers, dist, ecrire_verrou=True, vierge=False):
    if vierge:  # v13 : Maitrise, aucun contenu
        recettes, infos, progs = [], [], []
        app = dict(APP_DEFAUT, nom='Maitrise', vierge=True)
    else:
        recettes, infos = lire_univers(univers, ecrire_verrou)
        progs = lire_programmes(univers)
        app = lire_app(univers)
    for r in recettes:
        n, tot = biais_longueur(r)
        if tot >= 10 and n > BIAIS_SEUIL * tot:
            infos.append('%s : la bonne réponse est la plus longue dans %d %% des questions (%d sur %d) : on la devine sans '
                         'connaître le cours. Raccourcis-la ou étoffe les autres choix.' % (os.path.relpath(r['_dossier'], ROOT), round(100 * n / tot), n, tot))
        for th in (r.get('_revue') or {}).get('perimees', []):
            infos.append('%s/revue.md : la fiche « %s » a changé depuis la relecture du %s : sa pastille tombe. Relis-la avec '
                         'docs/grille-cours.md, puis mets à jour son empreinte (python3 build.py --empreintes %s).'
                         % (os.path.relpath(r['_dossier'], ROOT), th, r['_revue']['date'], os.path.relpath(r['_dossier'], ROOT)))
    langues, linfos = contenu_langues(univers, recettes, vierge)
    infos += linfos
    if not _I18N.get('affiche'):
        _I18N['affiche'] = True
        tb = lire_i18n()[0]
        infos.append('i18n : %d langue(s) (%s), %d clés ; %d clé(s) pas encore utilisée(s) par un appel littéral t("…") ni data-i18n'
                     % (len(tb), ', '.join(langues_i18n()), len(tb[LANGUE_DEFAUT]), _I18N['inutilisees']))
    for i in infos: print(i)
    def rd(p): return lire(os.path.join(ROOT, p))
    parts = sorted(glob.glob(os.path.join(ROOT, 'src', 'js', '*.js')))
    packs = {r['id']: pack_texte(r) for r in recettes if r.get('statut') == 'prête'}
    js = fragment_contenu(recettes, progs, app, packs, langues) + '\n' + '\n'.join(lire(p) for p in parts)
    entete = rd('src/head.html').replace('<title>Révisions</title>', '<title>%s</title>' % html.escape(app['nom']))
    page = entete + rd('src/styles.css') + '</style>' + rd('src/body.html') + '<script>(function(){"use strict";' + js + '})();</script>'
    os.makedirs(dist, exist_ok=True)
    # Vérification de syntaxe du JavaScript assemblé (avant d'écrire quoi que ce soit)
    chk = os.path.join(dist, '.check.js')
    io.open(chk, 'w', encoding='utf-8').write('(function(){"use strict";' + js + '})();')
    res = subprocess.run(['node', '--check', chk], capture_output=True, text=True)
    os.remove(chk)
    if res.returncode != 0:
        raise Erreurs([res.stderr])
    io.open(os.path.join(dist, 'index.html'), 'w', encoding='utf-8').write(page)
    body = re.sub(r'<meta name="claude:viewport-fit-sides"[^>]*>', '', page)
    head = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>')
    io.open(os.path.join(dist, 'standalone.html'), 'w', encoding='utf-8').write(head + body + '</body></html>')
    # v12 : la page de l'app iPhone (ios/, recopiée dans l'app à chaque build Xcode). Plein écran (viewport-fit=cover : les
    # marges de sécurité viennent des env() de styles.css) et une bande sous la barre d'état, pour que le texte qui défile
    # n'y passe pas. Contient les supports des cours, comme standalone.html : ne jamais la mettre en ligne.
    tete = ('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<style>body{margin:0}[hidden]{display:none!important}body::before{content:"";position:fixed;top:0;left:0;right:0;'
            'height:env(safe-area-inset-top,0px);background:var(--bg);z-index:60;pointer-events:none}</style>')
    io.open(os.path.join(dist, 'iphone.html'), 'w', encoding='utf-8').write(tete + body + '</body></html>')
    # v7 : un pack par matière prête (dist/packs/<id>.md), à importer dans une autre copie de l'app
    if not vierge:
        pk = os.path.join(dist, 'packs')
        os.makedirs(pk, exist_ok=True)
        for f in glob.glob(os.path.join(pk, '*.md')): os.remove(f)
        for i, t in packs.items(): io.open(os.path.join(pk, i + '.md'), 'w', encoding='utf-8').write(t)
    # v13 : tout le contenu au format d'échange (docs/format-donnees.md), à importer dans Maitrise ; rien sans matière prête
    if packs:
        dn = os.path.join(dist, 'donnees')
        os.makedirs(dn, exist_ok=True)
        io.open(os.path.join(dn, 'contenu.maitrise.json'), 'w', encoding='utf-8').write(donnees(recettes, progs, app))
    nq = sum(len(r['contenu']['qcm']) for r in recettes)
    print('%s/index.html' % os.path.relpath(dist, ROOT), len(page), 'caractères ·', len(parts), 'fragments JS ·',
          len(progs), 'univers,', len(recettes), 'matières,', nq, 'QCM · contenu et syntaxe OK')


if __name__ == '__main__':
    a = sys.argv[1:]
    def opt(n, d):
        return os.path.abspath(a[a.index(n) + 1]) if n in a else d
    try:
        if '--depaqueter' in a:
            i = a.index('--depaqueter')
            try: depaqueter(os.path.abspath(a[i + 1]), os.path.abspath(a[i + 2]))
            except ValueError as e: raise Erreurs(['bloc JSON du pack illisible (%s)' % e])
            sys.exit(0)
        if '--empreintes' in a:  # v7.4 : l'empreinte de chaque fiche d'une matière, à reporter dans sa revue.md
            e = []
            r = lire_matiere(os.path.abspath(a[a.index('--empreintes') + 1]), e)
            if e: raise Erreurs(e)
            for c in r['contenu']['cours']: print('%s · Empreinte : %s' % (c['th'], empreinte(c)))
            sys.exit(0)
        assembler(opt('--univers', os.path.join(ROOT, 'univers')), opt('--dist', os.path.join(ROOT, 'dist')), '--sans-verrou' not in a)
        if '--univers' not in a and '--dist' not in a:  # v7 : le moteur seul, sans contenu, à héberger ailleurs (modeles/moteur)
            m = os.path.join(ROOT, 'dist', 'moteur')
            assembler(os.path.join(ROOT, 'modeles', 'moteur'), m, False)
            os.makedirs(os.path.join(m, 'site'), exist_ok=True)  # à déposer tel quel sur un hébergeur : la page complète en index.html
            io.open(os.path.join(m, 'site', 'index.html'), 'w', encoding='utf-8').write(lire(os.path.join(m, 'standalone.html')))
            assembler(None, os.path.join(ROOT, 'dist', 'maitrise'), False, vierge=True)  # v13 : Maitrise, la version vierge
    except Erreurs as e:
        sys.stderr.write('Assemblage arrêté :\n' + ''.join('  - ' + x + '\n' for x in e.liste))
        sys.exit(1)
