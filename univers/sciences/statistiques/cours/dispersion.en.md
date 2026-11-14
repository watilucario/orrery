Durée : 10 min
Introduction : Two series can have the same mean and still be very different: one steady, the other widely spread. Spread measures this. This chapter covers the range, the variance, the standard deviation and the quartiles.

## Measuring spread
### The range
::: definition Range
The **range** is the gap between the largest and the smallest value. It looks only at the two extremes.
:::

::: formule
Range = maximum value − minimum value
:::

Two classes each have a mean of 10 over five tests, but their scores are nothing alike.

::: courbe Two classes, same mean
Axe : Test 1 | Test 2 | Test 3 | Test 4 | Test 5
Class A | 10 | 10 | 10 | 10 | 10
Class B | 2 | 6 | 10 | 14 | 18
Note : mean of 10 in both cases. Range of 0 for class A, 16 for class B.
:::

## Variance and standard deviation
### The principle
You look at how far each value is from the mean. Positive and negative gaps would cancel out, so you square them before averaging.

::: definition Variance and standard deviation
The **variance** is the average of the squared gaps to the mean. The **standard deviation** is its square root: it is expressed in the same unit as the data.
:::

::: formule
Population: variance = Σ(x − mean)² / n
Sample: variance = Σ(x − mean)² / (n − 1)
Standard deviation = √variance
:::

::: etapes Computing a standard deviation
Mean | m = sum of the values / n
Gaps | each value − m
Squares | each gap squared
Variance | sum of squares / n (or n − 1)
Standard deviation | square root of the variance
:::

### Population or sample
If you have **all** the values (the eight students of a class, nobody else), you divide by n. If your values are only part of a larger group (a poll), you divide by n − 1.

::: exemple Eight scores out of 20
Scores: 8; 10; 10; 12; 13; 14; 15; 18. Sum: 100, mean: 12.5.

- Sum of squared gaps: 72.
- Population: variance 72 / 8 = 9, standard deviation 3 (exactly).
- Sample: variance 72 / 7 ≈ 10.29, standard deviation ≈ 3.21 (rounded to the nearest hundredth).
:::

::: attention A constant does not change the spread
Adding 5 points to all the scores shifts the mean, not the standard deviation. Multiplying all the scores by 2 doubles the standard deviation.
:::

## Quartiles
### A measure that resists extremes
::: definition Quartiles
The **quartiles** split the sorted series into four groups of equal size. Q1 has a quarter of the values below it, Q3 has three quarters. The **interquartile range** is Q3 − Q1.
:::

Method used here: the median of each half (the median is set aside if n is odd). Software uses other methods that sometimes give close but different values.

::: exemple The seven salaries
Salaries: 1,700; 1,800; 1,800; 1,900; 2,000; 2,100; 2,300 €.

- Lower half (1,700; 1,800; 1,800): Q1 = €1,800.
- Upper half (2,000; 2,100; 2,300): Q3 = €2,100.
- Interquartile range: 2,100 − 1,800 = €300. Range: €600.
:::

Replace €2,300 with €9,000: the quartiles do not move, but the range and the standard deviation explode.

::: barres Before and after the €9,000 salary
Séries : Before | After
Range | 600 | 7 300
Interquartile range | 300 | 300
Standard deviation (population) | 192 | 2 493
Unité : €
Note : population standard deviations, rounded to the nearest euro. The interquartile range stays at €300.
:::

## À retenir
- Range = maximum − minimum; it looks only at the extremes.
- Variance = average of the squared gaps to the mean; standard deviation = its square root.
- Population: divide by n. Sample: divide by n − 1.
- The standard deviation has the same unit as the data; the variance has the squared unit.
- Adding a constant does not change the spread.
- Interquartile range = Q3 − Q1: it holds the central half of the values.
- Quartiles resist extreme values; the range and the standard deviation do not.

Sources : Standard definitions of descriptive statistics; made-up data for the demo, recomputed with python3.
