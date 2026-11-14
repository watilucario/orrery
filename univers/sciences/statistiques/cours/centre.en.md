Durée : 8 min
Introduction : A series of numbers is hard to read as it stands. You summarise it with a "middle" value: the mean, the median or the mode. This chapter teaches you to compute them, compare them and pick the right one.

## Three ways to summarise a series
### The mean
::: definition Mean
The **mean** is the sum of the values divided by how many there are. If you shared the total equally, everyone would receive the mean.
:::

::: formule
Mean = (x₁ + x₂ + … + xₙ) / n
:::

### The median and the mode
::: definition Median
The **median** splits the sorted series into two halves of equal size. With an odd number of values, it is the middle one. With an even number, it is the mean of the two middle values.
:::

::: definition Mode
The **mode** is the most frequent value. It also works for categories (a colour, a city), where a mean makes no sense.
:::

::: exemple Seven monthly salaries
Salaries in euros, sorted: 1,700; 1,800; 1,800; 1,900; 2,000; 2,100; 2,300.

- Sum: €13,600. Mean: 13,600 / 7 ≈ €1,943 (rounded to the nearest euro).
- Median: the 4th value, which is €1,900.
- Mode: €1,800 (twice).
:::

::: barres The seven salaries
Employee 1 | 1 700
Employee 2 | 1 800
Employee 3 | 1 800
Employee 4 | 1 900
Employee 5 | 2 000
Employee 6 | 2 100
Employee 7 | 2 300
Unité : €
Note : the median is the middle bar (€1,900), the mode is the value that appears twice (€1,800).
:::

## When an extreme value gets involved
The mean uses all the values, so an extreme shifts it. The median depends only on rank: it barely moves. Let's replace the €2,300 salary with €9,000 in the example.

::: barres Before and after the €9,000 salary
Séries : Before | After
Mean | 1 943 | 2 900
Median | 1 900 | 1 900
Mode | 1 800 | 1 800
Unité : €
Note : the mean goes from €1,943 to €2,900 (20,300 / 7). The median and the mode do not move.
:::

::: attention The mean is not "the typical salary"
With one very high isolated salary, almost nobody earns the mean: here, six employees out of seven earn less than €2,900. In that case, report the median too.
:::

## Choosing the right indicator
| Situation | Most useful indicator |
|---|---|
| Steady values, no extreme | Mean |
| Spread-out values or an isolated extreme (salaries, house prices) | Median |
| Categories (colour, brand) | Mode |

::: camembert Favourite colour of 20 students
Blue | 8
Green | 6
Red | 4
Yellow | 2
Total : 20
Note : the mode is "blue". Computing a mean of colours would make no sense.
:::

## À retenir
- Mean = sum of the values divided by how many there are.
- Median = middle value of the sorted series (mean of the two middle ones if n is even).
- Mode = most frequent value; the only possible indicator for unordered categories.
- An extreme shifts the mean a lot, the median very little.
- The median is not always a value of the series.
- For salaries or prices, give the median next to the mean.
- Always sort the series before looking for the median.

Sources : Standard definitions of descriptive statistics; made-up data for the demo, recomputed with python3.
