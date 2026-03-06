import React, { useMemo, useRef, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Chart as ChartJS, registerables } from "chart.js";

ChartJS.register(...registerables);

const tsRegex = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),(\d{3})/;
const inputTsRegex = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2}),(\d{3})$/;

const chartColors = [
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#e11d48",
  "#a855f7",
  "#14b8a6",
  "#facc15",
  "#38bdf8",
];

function parseLogTsMs(match) {
  const iso = match[1].replace(" ", "T") + "." + match[2];
  return Date.parse(iso);
}

function parseInputTsMs(value) {
  if (!value) return NaN;
  const m = value.trim().match(inputTsRegex);
  if (!m) return NaN;
  const iso = `${m[1]}T${m[2]}.${m[3]}`;
  return Date.parse(iso);
}

function chooseBucketSize(msRange) {
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;

  if (msRange <= 30 * min) return min;
  if (msRange <= 6 * hour) return 5 * min;
  if (msRange <= day) return 15 * min;
  return hour;
}

function formatBucketLabel(tsMs) {
  const d = new Date(tsMs);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function highlightConfigText(text) {
  const keys = [
    "scheduler.instanceId",
    "jobStore.clustered",
    "jobStore.acquireTriggersWithinLock",
  ];

  const escaped = String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  let result = escaped;
  for (const key of keys) {
    const re = new RegExp(`(^|\\n)(quartz\\.${key})(\\s*=)`, "g");
    result = result.replace(
      re,
      `$1<span style="font-weight:600;color:#0288d1;">$2</span>$3`,
    );
  }

  return result;
}

function StatCard({ label, value }) {
  return (
    <Paper variant='outlined' sx={{ p: 1.5, minWidth: 180 }}>
      <Typography variant='caption' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='h6'>{value}</Typography>
    </Paper>
  );
}

function AboutBlock() {
  return (
    <Tooltip
      arrow
      placement='bottom-end'
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant='subtitle2' sx={{ mb: 1 }}>
            Scheduler.log Analyzer
          </Typography>

          <Typography variant='body2' sx={{ fontWeight: 700 }}>
            Purpose
          </Typography>
          <Typography variant='body2' sx={{ mb: 1 }}>
            Analyze Creatio <code>Scheduler.log</code> files.
          </Typography>

          <Box component='ul' sx={{ m: 0, pl: 2, mb: 1 }}>
            <li>
              <Typography variant='body2'>
                JobStart statistics by class
              </Typography>
            </li>
            <li>
              <Typography variant='body2'>Time-based JobStart load</Typography>
            </li>
            <li>
              <Typography variant='body2'>
                Scheduler configuration inspection
              </Typography>
            </li>
          </Box>

          <Typography variant='body2' sx={{ fontWeight: 700 }}>
            Input file
          </Typography>
          <Typography variant='body2' sx={{ mb: 1 }}>
            Upload a <code>Scheduler.log</code> file from Creatio application
            Nlog (currently only on-site .NET Framework app logs are supported).
          </Typography>

          <Typography variant='body2' sx={{ fontWeight: 700 }}>
            Controls
          </Typography>
          <Box component='ul' sx={{ m: 0, pl: 2, mb: 1 }}>
            <li>
              <Typography variant='body2'>
                <b>Apply</b> — apply date/time filter
              </Typography>
            </li>
            <li>
              <Typography variant='body2'>
                <b>Visualise jobs</b> — render JobStart load chart
              </Typography>
            </li>
          </Box>

          <Typography variant='body2'>
            Time values are taken from the log without timezone assumptions.
          </Typography>
        </Box>
      }
    >
      <Stack direction='row' spacing={0.5} alignItems='center'>
        <IconButton size='small' color='primary'>
          <InfoOutlinedIcon fontSize='small' />
        </IconButton>
        <Typography variant='body2' color='text.secondary'>
          About
        </Typography>
      </Stack>
    </Tooltip>
  );
}

export default function SchedulerLogAnalyzer() {
  const [events, setEvents] = useState([]);
  const [schedulerConfigs, setSchedulerConfigs] = useState([]);
  const [firstTsStr, setFirstTsStr] = useState("");
  const [lastTsStr, setLastTsStr] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [errorText, setErrorText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [chartVisible, setChartVisible] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const filteredResult = useMemo(() => {
    const fromMs = parseInputTsMs(fromTime);
    const toMs = parseInputTsMs(toTime);

    if (!fromTime && !toTime) {
      return {
        statsByClass: {},
        filteredEvents: [],
        filteredTotalJobStart: 0,
        fromMs: NaN,
        toMs: NaN,
        isValidRange: false,
      };
    }

    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs) {
      return {
        statsByClass: {},
        filteredEvents: [],
        filteredTotalJobStart: 0,
        fromMs,
        toMs,
        isValidRange: false,
      };
    }

    const statsByClass = {};
    const filteredEvents = [];

    for (const e of events) {
      if (e.tsMs < fromMs || e.tsMs > toMs) continue;
      filteredEvents.push(e);
      statsByClass[e.className] = (statsByClass[e.className] || 0) + 1;
    }

    return {
      statsByClass,
      filteredEvents,
      filteredTotalJobStart: filteredEvents.length,
      fromMs,
      toMs,
      isValidRange: true,
    };
  }, [events, fromTime, toTime]);

  const sortedClassStats = useMemo(() => {
    return Object.entries(filteredResult.statsByClass).sort(
      (a, b) => b[1] - a[1],
    );
  }, [filteredResult]);

  const fileStats = useMemo(() => {
    return {
      totalJobStart: events.length,
      filteredTotalJobStart: filteredResult.filteredTotalJobStart,
    };
  }, [events.length, filteredResult.filteredTotalJobStart]);

  const handleApplyFilter = () => {
    setErrorText("");

    const fromMs = parseInputTsMs(fromTime);
    const toMs = parseInputTsMs(toTime);

    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) {
      setErrorText("Invalid time format. Expected: YYYY-MM-DD HH:mm:ss,SSS");
      return;
    }

    if (fromMs > toMs) {
      setErrorText("Invalid range: From is greater than To");
      return;
    }

    if (chartVisible) {
      setChartReady((v) => !v);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setEvents([]);
    setSchedulerConfigs([]);
    setFirstTsStr("");
    setLastTsStr("");
    setFromTime("");
    setToTime("");
    setErrorText("");
    setChartVisible(false);

    const text = await file.text();
    const lines = text.split(/\r?\n/);

    const nextEvents = [];
    const nextConfigs = [];

    let currentConfig = null;
    let nextFirstTs = "";
    let nextLastTs = "";

    for (const line of lines) {
      const tsMatch = line.match(tsRegex);

      if (tsMatch) {
        if (currentConfig) {
          nextConfigs.push(currentConfig);
          currentConfig = null;
        }

        const tsStr = `${tsMatch[1]},${tsMatch[2]}`;
        const tsMs = parseLogTsMs(tsMatch);

        if (!nextFirstTs) nextFirstTs = tsStr;
        nextLastTs = tsStr;

        if (line.includes("LogSchedulerConfiguration")) {
          currentConfig = { tsStr, text: line + "\n" };
          continue;
        }

        if (line.includes("JobStart")) {
          const cls = line.match(/className:([^,\]]+)/);
          if (cls) {
            nextEvents.push({
              tsMs,
              className: cls[1].trim(),
            });
          }
        }
      } else if (currentConfig) {
        currentConfig.text += line + "\n";
      }
    }

    if (currentConfig) {
      nextConfigs.push(currentConfig);
    }

    setEvents(nextEvents);
    setSchedulerConfigs(nextConfigs);
    setFirstTsStr(nextFirstTs);
    setLastTsStr(nextLastTs);
    setFromTime(nextFirstTs);
    setToTime(nextLastTs);
  };

  const renderChart = () => {
    if (!canvasRef.current) return;
    if (!filteredResult.isValidRange) return;

    const fromMs = filteredResult.fromMs;
    const toMs = filteredResult.toMs;
    const rangeMs = toMs - fromMs;
    const bucketSize = chooseBucketSize(rangeMs);

    const buckets = new Map();

    for (const e of events) {
      if (e.tsMs < fromMs || e.tsMs > toMs) continue;

      const bucketTs = Math.floor(e.tsMs / bucketSize) * bucketSize;

      if (!buckets.has(bucketTs)) {
        buckets.set(bucketTs, { total: 0, byClass: new Map() });
      }

      const bucket = buckets.get(bucketTs);
      bucket.total += 1;
      bucket.byClass.set(
        e.className,
        (bucket.byClass.get(e.className) || 0) + 1,
      );
    }

    if (!buckets.size) {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return;
    }

    const bucketKeys = Array.from(buckets.keys()).sort((a, b) => a - b);

    const classTotals = new Map();
    for (const bucket of buckets.values()) {
      for (const [cls, cnt] of bucket.byClass.entries()) {
        classTotals.set(cls, (classTotals.get(cls) || 0) + cnt);
      }
    }

    const TOP_N = 8;
    const topClasses = Array.from(classTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)
      .map((x) => x[0]);

    const datasets = topClasses.map((cls, i) => ({
      label: cls,
      stack: "jobstart",
      backgroundColor: chartColors[i % chartColors.length],
      data: bucketKeys.map((ts) => buckets.get(ts).byClass.get(cls) || 0),
    }));

    datasets.push({
      label: "Other",
      stack: "jobstart",
      backgroundColor: "#475569",
      data: bucketKeys.map((ts) => {
        const bucket = buckets.get(ts);
        let sum = 0;
        for (const [cls, cnt] of bucket.byClass.entries()) {
          if (!topClasses.includes(cls)) sum += cnt;
        }
        return sum;
      }),
    });

    const labels = bucketKeys.map(formatBucketLabel);

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new ChartJS(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        animation: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`,
              footer: (items) => {
                let total = 0;
                for (const item of items) {
                  total += item.parsed.y || 0;
                }
                return `Total JobStart: ${total}`;
              },
            },
          },
          legend: {
            labels: {
              boxWidth: 12,
            },
          },
        },
      },
    });
  };

  React.useEffect(() => {
    if (!chartVisible) return;
    renderChart();
    return () => {};
  }, [chartVisible, chartReady, events, fromTime, toTime]);

  React.useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Paper variant='outlined' sx={{ p: 2 }}>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
          >
            <Typography variant='h5' fontWeight={700}>
              Scheduler.log Analyzer
            </Typography>
            <AboutBlock />
          </Stack>
        </Paper>

        <Paper variant='outlined' sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              alignItems={{ md: "center" }}
            >
              <Button variant='contained' component='label'>
                Choose Scheduler.log file
                <input
                  hidden
                  type='file'
                  accept='.log,.txt'
                  onChange={handleFileChange}
                />
              </Button>

              <Button
                variant='outlined'
                onClick={() => {
                  setChartVisible(true);
                  setChartReady((v) => !v);
                }}
                disabled={!events.length}
              >
                Visualise jobs
              </Button>

              {!!selectedFileName && (
                <Typography variant='body2' color='text.secondary'>
                  {selectedFileName}
                </Typography>
              )}
            </Stack>

            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              <StatCard label='First log entry' value={firstTsStr || "—"} />
              <StatCard label='Last log entry' value={lastTsStr || "—"} />
              <StatCard
                label='Total JobStart'
                value={fileStats.totalJobStart}
              />
              <StatCard
                label='Total JobStart (filtered)'
                value={fileStats.filteredTotalJobStart}
              />
            </Stack>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <TextField
                label='From'
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                fullWidth
                size='small'
                placeholder='YYYY-MM-DD HH:mm:ss,SSS'
              />
              <TextField
                label='To'
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                fullWidth
                size='small'
                placeholder='YYYY-MM-DD HH:mm:ss,SSS'
              />
              <Button variant='contained' onClick={handleApplyFilter}>
                Apply
              </Button>
            </Stack>

            {!!errorText && <Alert severity='error'>{errorText}</Alert>}
          </Stack>
        </Paper>

        <Accordion defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>
              Scheduler configuration messages{" "}
              <Chip
                size='small'
                label={
                  schedulerConfigs.length
                    ? schedulerConfigs.length
                    : "not found"
                }
                sx={{ ml: 1 }}
              />
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {!schedulerConfigs.length ? (
              <Typography color='text.secondary'>
                No LogSchedulerConfiguration entries were found.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {schedulerConfigs.map((cfg, i) => (
                  <Paper
                    key={`${cfg.tsStr}-${i}`}
                    variant='outlined'
                    sx={{ p: 2 }}
                  >
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      #{i + 1} — {cfg.tsStr}
                    </Typography>
                    <Box
                      component='pre'
                      sx={{
                        m: 0,
                        p: 2,
                        bgcolor: "grey.100",
                        borderRadius: 1,
                        overflowX: "auto",
                        whiteSpace: "pre-wrap",
                        fontFamily: "monospace",
                        fontSize: 13,
                      }}
                      dangerouslySetInnerHTML={{
                        __html: highlightConfigText(cfg.text),
                      }}
                    />
                  </Paper>
                ))}
              </Stack>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={chartVisible}
          onChange={(_, expanded) => setChartVisible(expanded)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>JobStart load over time</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {!filteredResult.isValidRange ? (
              <Typography color='text.secondary'>
                Apply a valid time range to render the chart.
              </Typography>
            ) : filteredResult.filteredTotalJobStart === 0 ? (
              <Typography color='text.secondary'>
                No JobStart entries found in the selected time range.
              </Typography>
            ) : (
              <Box sx={{ height: 420 }}>
                <canvas ref={canvasRef} />
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        <Paper variant='outlined' sx={{ overflowX: "auto" }}>
          <Box sx={{ p: 2, pb: 0 }}>
            <Typography variant='h6'>JobStart statistics by class</Typography>
          </Box>

          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ClassName</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>JobStart count</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!sortedClassStats.length ? (
                <TableRow>
                  <TableCell colSpan={2}>
                    <Typography color='text.secondary'>
                      No data for the current filter.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedClassStats.map(([className, count]) => (
                  <TableRow key={className} hover>
                    <TableCell>{className}</TableCell>
                    <TableCell>{count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>

        <Divider />
      </Stack>
    </Box>
  );
}
