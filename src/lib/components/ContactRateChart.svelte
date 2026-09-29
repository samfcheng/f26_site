<script>
  // Weekly share of leads contacted within 24 hours. Labelled points are exact
  // from the analytics chart; the rest were read off its gridlines (±1).
  const start = new Date(2026, 3, 27);
  const values = [8.3, 18.5, 31.6, 85.1, 73.9, 93.3, 96.4, 100, 85.4, 82, 90.3, 80.1, 87.5, 87.5, 94.1, 90.5];
  const weeks = values.map((value, i) => {
    const from = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i * 7);
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6);
    return { value, from, to };
  });
  const short = date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const range = ({ from, to }) => `${short(from)}–${from.getMonth() === to.getMonth() ? to.getDate() : short(to)}`;
  const ticks = [0, 5, 10, 15];

  let width = $state(496);
  const height = 220, top = 16, right = 12, bottom = 28, left = 40;
  const x = $derived(i => left + (i / (values.length - 1)) * (width - left - right));
  const y = value => top + (1 - value / 100) * (height - top - bottom);
  const path = $derived(weeks.map((week, i) => `${i ? 'L' : 'M'}${x(i)},${y(week.value)}`).join(''));

  let active = $state(null);
  function point(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const i = Math.round(((event.clientX - rect.left - left) / (width - left - right)) * (values.length - 1));
    active = Math.max(0, Math.min(values.length - 1, i));
  }
</script>

<div class="chart" bind:clientWidth={width}>
  <svg {width} {height} role="img" aria-label="Line chart: leads contacted within 24 hours rose from 8% in late April to between 80% and 100% every week from June on." onpointermove={point} onpointerleave={() => active = null}>
    {#each [0, 50, 100] as value}
      <line class="grid" x1={left} x2={width - right} y1={y(value)} y2={y(value)} />
      <text class="axis" x={left - 8} y={y(value)} text-anchor="end" dominant-baseline="middle">{value}%</text>
    {/each}
    {#each ticks as i}
      <text class="axis" x={x(i)} y={height - 6} text-anchor={i === 0 ? 'start' : i === values.length - 1 ? 'end' : 'middle'}>{short(weeks[i].from)}</text>
    {/each}
    <path class="line" d={path} />
    {#each [0, values.length - 1] as i}
      <circle class="end" cx={x(i)} cy={y(values[i])} r="4" />
      <text class="value" x={x(i) + (i ? -8 : 8)} y={y(values[i]) + (i ? -10 : 4)} text-anchor={i ? 'end' : 'start'}>{Math.round(values[i])}%</text>
    {/each}
    {#if active !== null}
      <line class="crosshair" x1={x(active)} x2={x(active)} y1={top} y2={height - bottom} />
      <circle class="end" cx={x(active)} cy={y(values[active])} r="5" />
    {/if}
  </svg>
  {#if active !== null}
    <div class="tooltip" style:left="{x(active)}px" style:top="{y(values[active])}px" class:flip={x(active) > width - 120} aria-hidden="true">
      <span>Week of {range(weeks[active])}</span>
      <strong>{Math.round(values[active])}%</strong>
    </div>
  {/if}
  <table class="visually-hidden">
    <caption>Leads contacted within 24 hours, by week</caption>
    <thead><tr><th scope="col">Week</th><th scope="col">Contacted within 24 hours</th></tr></thead>
    <tbody>
      {#each weeks as week}<tr><td>{range(week)}</td><td>{Math.round(week.value)}%</td></tr>{/each}
    </tbody>
  </table>
</div>

<style>
  .chart{position:relative;margin-top:20px;touch-action:pan-y}
  svg{display:block;overflow:visible}
  .grid{stroke:#d0c9df;stroke-width:1}
  .axis{font-size:12px;fill:#685678}
  .line{fill:none;stroke:#4b3a8c;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
  .end{fill:#4b3a8c;stroke:#eeebf8;stroke-width:2}
  .value{font-size:13px;font-weight:500;fill:#1a1523}
  .crosshair{stroke:#4b3a8c;stroke-width:1;stroke-dasharray:2 3;opacity:.6}
  .tooltip{position:absolute;transform:translate(12px,-50%);padding:8px 10px;background:#1a1523;color:#fff;border-radius:6px;font-size:12px;line-height:1.35;white-space:nowrap;pointer-events:none}
  .tooltip.flip{transform:translate(calc(-100% - 12px),-50%)}
  .tooltip span{display:block;opacity:.7}
  .tooltip strong{font-size:14px;font-weight:500}
  .visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
</style>
