# Cas

## planifier · Scheduling the reviews of a card
Thème : espacement

> You use the form from the course sheet: R(t, S) = (1 + 19/81 × t/S)^(−0.5).
> | Data | Value |
> |---|---|
> | Stability of the card | 4 days |
> | Last review | day 0 |
> | Target retention | 90% |

### pl1
What is the probability of recall on day 8 if you do not review?

- [ ] 90.0%
- [ ] 94.6%
- [x] 82.5%
- [ ] 71.8%

Explication : t/S = 8/4 = 2, so R = (1 + 19/81 × 2)^(−0.5) = 0.825.

Source : Course sheet · spacing

### pl2
When does R reach 90%?

- [x] On day 4
- [ ] On day 2
- [ ] On day 8
- [ ] On day 10

Explication : stability is the delay at which R equals 90%. Here S = 4 days: that is day 4.

Source : Course sheet · forgetting

### pl3
You review on day 4 and succeed. Suppose stability rises to 10 days. On which day is the next review, to aim for 90%?

- [ ] On day 10
- [ ] On day 24
- [x] On day 14
- [ ] On day 8

Explication : the interval equals S, i.e. 10 days counted from day 4. The next review falls on day 14.

Source : Course sheet · spacing

### pl4
If you had not reviewed on day 4, what would R be on day 14?

- [ ] 82.5%
- [ ] 90.0%
- [ ] 67.8%
- [x] 74.1%

Explication : t/S = 14/4 = 3.5, so R = (1 + 19/81 × 3.5)^(−0.5) = 0.741. Reviewing on day 4 keeps R higher for longer.

Source : Course sheet · spacing
