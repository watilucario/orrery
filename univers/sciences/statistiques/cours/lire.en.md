Durée : 9 min
Introduction : In the news, a figure or a chart can be accurate and still misleading. This chapter gives you four reflexes: check the axis, tell points from percent, be wary of supposed causes, and check the sample size.

## Reading a chart
### The truncated axis
A bar chart should start at zero, because the height of a bar represents its value. If the axis starts higher, a small difference looks huge.

::: barres Sales in two months (honest chart)
Month 1 | 1 200
Month 2 | 1 230
Note : the axis starts at zero, and the difference is 2.5%. With an axis starting at 1,180, the bars would be 20 and 50 tall: the 2nd would look 2.5 times bigger.
:::

::: attention Check where the axis starts
Before comparing heights, read the first tick. An axis that does not start at zero is not an error in itself for a line chart, but it is misleading for bars.
:::

## Reading a percentage
### Percentage points or percent
::: definition Percentage point
A **percentage point** is the gap between two percentages. A **percentage change** measures the gap relative to the starting value.
:::

::: exemple An unemployment rate from 8% to 10%
- In points: 10 − 8 = 2 points.
- In relative terms: 2 / 8 = 0.25, or +25%.
- Writing "+2%" mixes the two and causes confusion.
:::

### Rise then fall
::: formule
Final price = starting price × (1 + rise) × (1 − fall)
:::

A price of 100 that rises by 20% then falls by 20% becomes 100 × 1.20 × 0.80 = 96, which is −4%. The fall applies to a larger base than the rise.

## Correlation and causation
Two quantities are **correlated** when they vary together. That does not prove that one causes the other: a common cause or chance can be enough.

::: courbe Ice cream and sunburns, from March to August
Axe : March | April | May | June | July | August
Ice cream sold | 10 | 12 | 20 | 35 | 50 | 55
Sunburns | 5 | 8 | 14 | 28 | 40 | 46
Note : made-up data, as an index. Both curves rise together because good weather acts on both.
:::

::: attention Correlation is not causation
When someone claims a relationship, ask three questions: could one come from the other the other way round? Does a third cause explain both? Is chance possible with so little data?
:::

## Sample size
A poll asks some of the people, not everyone. Its result is therefore approximate.

::: formule
Margin of error (95%) ≈ 1 / √n, where n is the number of people surveyed
:::

This rough rule holds for a randomly drawn sample.

::: barres Margin of error by sample size
100 | 10
400 | 5
1 000 | 3,2
2 500 | 2
Unité : points
Note : 1 / √100 = 10 points, 1 / √400 = 5 points, 1 / √1,000 ≈ 3.2 points, 1 / √2,500 = 2 points.
:::

::: exemple 52% among 1,000 people
The margin is about 3 points: the true score is probably between 49% and 55%. You cannot claim that a majority is in favour.
:::

## À retenir
- For bars, the axis must start at zero; always check the first tick.
- Percentage point = gap between two percentages; percent = gap relative to the start.
- From 8% to 10%: +2 points, or +25%.
- +20% then −20% does not bring you back to the start: it makes −4%.
- Correlation is not causation: look for a common cause.
- Margin of error ≈ 1 / √n: the larger n is, the smaller it is.
- Ask how many people answered and how they were chosen.

Sources : Usual rules for reading statistics; made-up data for the demo, calculations checked with python3.
