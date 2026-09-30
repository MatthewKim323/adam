# Frames

> CDP screencast, every compositor frame, desktop, 1x, cropped to the component (+24px). `t` = ms since recording began. A gap between frames means nothing repainted.

| scenario | frames | motion first -> last ms | ranges | notes |
|---|---|---|---|---|
| load | 293 | 270 -> 5514 | 270-270, 421-5514 |  |
| hover-00-link | 170 | 35 -> 3069 | 35-3069 |  |
| hover-01-field | 170 | 32 -> 3068 | 32-3068 |  |
| loop | 330 | 34 -> 6148 | 34-6148 | no change on hover |

Compare your build with `clonethis frames <build url> <out> --select "[data-clone-root]" --scenario <name>` and `clonethis sheet` on both folders at the same step.
