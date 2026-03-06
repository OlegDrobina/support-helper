import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Pagination,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const PAGE_SIZE = 50;

const dict = {
  en: {
    title: "Trace analyzer",
    showTextInput: "Show text input",
    hideTextInput: "Hide text input",
    parseText: "Parse text",
    parseFile: "Parse file",
    search: "Search",
    resetSorting: "Reset sorting",
    totalLines: "Total lines",
    valid: "Valid",
    errors: "Errors",
    found: "Found",
    maxDuration: "Max Duration",
    avgDuration: "Avg Duration",
    codeBreakdown: "Code breakdown",
    noData: "No data or nothing matches the filter.",
    details: "Details",
    noParams: "No parameters",
    copy: "Copy",
    copied: "Copied!",
    interpolate: "Interpolate",
    interpolatedSql: "Interpolated SQL",
    sqlQuery: "SQL Query",
    parameters: "Parameters",
    stackTrace: "StackTrace",
    eventProperties: "Event Properties",
    searchPlaceholder: "Search...",
    pasteLogsHere: "Paste logs here",
  },
  uk: {
    title: "Аналітика трасування",
    showTextInput: "Показати поле вводу",
    hideTextInput: "Сховати поле вводу",
    parseText: "Розібрати текст",
    parseFile: "Розібрати файл",
    search: "Пошук",
    resetSorting: "Скинути сортування",
    totalLines: "Усього рядків",
    valid: "Успішно",
    errors: "Помилок",
    found: "Знайдено",
    maxDuration: "Макс Duration",
    avgDuration: "Середній Duration",
    codeBreakdown: "Статистика Code",
    noData: "Немає даних або нічого не знайдено.",
    details: "Деталі",
    noParams: "Немає параметрів",
    copy: "Копіювати",
    copied: "Скопійовано!",
    interpolate: "Інтерполювати",
    interpolatedSql: "Інтерпольований SQL",
    sqlQuery: "SQL Query",
    parameters: "Параметри",
    stackTrace: "StackTrace",
    eventProperties: "Властивості події",
    searchPlaceholder: "Пошук...",
    pasteLogsHere: "Вставте логи сюди",
  },
};

function flattenRow(obj) {
  return {
    Duration: Number(obj.Duration || 0),
    Code: obj.Code || "",
    StartedOn: obj.StartedOn || "",
    Id: obj.Id || "",
    ParentId: obj.ParentId || "",
    SQLText: (obj.Data?.SQLText || "").replace(/\s+/g, " ").trim(),
    __full: obj,
  };
}

function formatSQL(sql) {
  if (!sql) return "";

  let result = sql.replace(/\s+/g, " ").trim();

  const keywords = [
    "SELECT",
    "UPDATE",
    "INSERT",
    "DELETE",
    "FROM",
    "WHERE",
    "SET",
    "GROUP BY",
    "ORDER BY",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "JOIN",
    "AND",
    "OR",
    "LIMIT",
    "OFFSET",
  ];

  keywords.forEach((kw) => {
    result = result.replace(new RegExp(`\\b${kw}\\b`, "gi"), `\n${kw}`);
  });

  result = result.replace(/\n(AND|OR)\b/g, "\n    $1");
  result = result.replace(/\nSELECT\b/i, "SELECT\n    ");

  return result.trim();
}

function formatStack(stack) {
  if (!stack) return "";
  return stack
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}

function interpolateSQL(sql, params) {
  let result = (sql || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "    ")
    .trim();

  const map = {};

  params.forEach((p) => {
    let value = p.Value;

    switch (p.Type) {
      case 11:
        value = Number(value);
        break;
      case 9:
      case 16:
      case 6:
        value = `'${value}'`;
        break;
      case 3:
        value = value ? "TRUE" : "FALSE";
        break;
      default:
        return;
    }

    map[p.Name] = `${value} /*@${p.Name}*/`;
  });

  Object.keys(map).forEach((name) => {
    result = result.replace(new RegExp(`@${name}\\b`, "g"), map[name]);
  });

  const keywords = [
    "SELECT",
    "UPDATE",
    "INSERT",
    "DELETE",
    "FROM",
    "WHERE",
    "SET",
    "GROUP BY",
    "ORDER BY",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "JOIN",
  ];

  keywords.forEach((kw) => {
    result = result.replace(new RegExp(`\\b${kw}\\b`, "gi"), `\n${kw}`);
  });

  result = result.replace(/\nSET\b/i, "\nSET\n    ");
  result = result.replace(/\nWHERE\b/i, "\nWHERE\n    ");
  result = result.replace(/\n\s*\n+/g, "\n");

  return result.trim();
}

function DurationChip({ value }) {
  const numeric = Number(value || 0);

  let color = "default";
  if (numeric >= 500) color = "error";
  else if (numeric > 0 && numeric <= 50) color = "success";

  return (
    <Chip
      size='small'
      label={numeric.toFixed(2)}
      color={color}
      variant='outlined'
    />
  );
}

function SortableHeader({ label, field, sortState, onSort }) {
  const suffix =
    sortState.field === field ? (sortState.dir === "asc" ? " ▲" : " ▼") : "";

  return (
    <TableCell
      onClick={onSort}
      sx={{
        cursor: "pointer",
        userSelect: "none",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {suffix}
    </TableCell>
  );
}

function StatCard({ label, value }) {
  return (
    <Paper variant='outlined' sx={{ p: 1.5, minWidth: 140 }}>
      <Typography variant='caption' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='h6'>{value}</Typography>
    </Paper>
  );
}

function CodeBreakdown({ rows, label }) {
  const content = useMemo(() => {
    const bucket = {};
    rows.forEach((r) => {
      bucket[r.Code] = (bucket[r.Code] || 0) + 1;
    });

    return Object.entries(bucket)
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => `${code || "(empty)"} — ${count}`)
      .join("\n");
  }, [rows]);

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{label}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          component='pre'
          sx={{
            m: 0,
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: 13,
          }}
        >
          {content || "—"}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

function DetailsPanel({ item, lang }) {
  const d = dict[lang];
  const [interpolated, setInterpolated] = useState("");
  const [copySqlText, setCopySqlText] = useState(d.copy);
  const [copyInterpolatedText, setCopyInterpolatedText] = useState(d.copy);

  const sql = formatSQL(item.Data?.SQLText || "");
  const params = item.Data?.Parameters || [];
  const stack = formatStack(item.Data?.StackTrace || item.StackTrace || "");

  const copyToClipboard = async (text, target) => {
    await navigator.clipboard.writeText(text || "");
    if (target === "sql") {
      setCopySqlText(d.copied);
      setTimeout(() => setCopySqlText(d.copy), 1000);
    } else {
      setCopyInterpolatedText(d.copied);
      setTimeout(() => setCopyInterpolatedText(d.copy), 1000);
    }
  };

  return (
    <Stack spacing={2}>
      <Paper variant='outlined' sx={{ p: 2 }}>
        <Typography variant='subtitle1' gutterBottom>
          {d.eventProperties}
        </Typography>

        <Table size='small'>
          <TableBody>
            {Object.keys(item)
              .filter((k) => k !== "Data" && k !== "StackTrace")
              .map((k) => (
                <TableRow key={k}>
                  <TableCell sx={{ fontWeight: 600, width: 220 }}>
                    {k}
                  </TableCell>
                  <TableCell>{String(item[k])}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper variant='outlined' sx={{ p: 2 }}>
        <Stack
          direction='row'
          spacing={1}
          justifyContent='space-between'
          alignItems='center'
          sx={{ mb: 1 }}
        >
          <Typography variant='subtitle1'>{d.sqlQuery}</Typography>
          <Stack direction='row' spacing={1}>
            <Button
              variant='outlined'
              size='small'
              onClick={() => copyToClipboard(sql, "sql")}
            >
              {copySqlText}
            </Button>
            <Button
              variant='contained'
              size='small'
              onClick={() =>
                setInterpolated(
                  interpolateSQL(item.Data?.SQLText || "", params),
                )
              }
            >
              {d.interpolate}
            </Button>
          </Stack>
        </Stack>

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
        >
          {sql || "—"}
        </Box>

        {!!interpolated && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack
              direction='row'
              spacing={1}
              justifyContent='space-between'
              alignItems='center'
              sx={{ mb: 1 }}
            >
              <Typography variant='subtitle1'>{d.interpolatedSql}</Typography>
              <Button
                variant='outlined'
                size='small'
                onClick={() => copyToClipboard(interpolated, "interpolated")}
              >
                {copyInterpolatedText}
              </Button>
            </Stack>

            <Box
              component='pre'
              sx={{
                m: 0,
                p: 2,
                bgcolor: "grey.100",
                borderRadius: 1,
                overflowX: "auto",
                whiteSpace: "pre",
                fontFamily: "monospace",
                fontSize: 13,
              }}
            >
              {interpolated}
            </Box>
          </>
        )}
      </Paper>

      <Paper variant='outlined' sx={{ p: 2 }}>
        <Typography variant='subtitle1' gutterBottom>
          {d.parameters}
        </Typography>

        {!params.length ? (
          <Typography color='text.secondary'>{d.noParams}</Typography>
        ) : (
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {params.map((p, i) => (
                <TableRow key={i}>
                  <TableCell>{p.Name}</TableCell>
                  <TableCell>{p.Type}</TableCell>
                  <TableCell>{String(p.Value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Paper variant='outlined' sx={{ p: 2 }}>
        <Typography variant='subtitle1' gutterBottom>
          {d.stackTrace}
        </Typography>

        <Box
          component='pre'
          sx={{
            m: 0,
            p: 2,
            bgcolor: "grey.100",
            borderRadius: 1,
            overflowX: "auto",
            whiteSpace: "pre",
            fontFamily: "monospace",
            fontSize: 13,
          }}
        >
          {stack || "—"}
        </Box>
      </Paper>
    </Stack>
  );
}

export default function TraceAnalyzer() {
  const [lang, setLang] = useState("en");
  const [showTextInput, setShowTextInput] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [rowsOriginal, setRowsOriginal] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [searchColumn, setSearchColumn] = useState("Duration");
  const [searchInput, setSearchInput] = useState("");
  const [sortState, setSortState] = useState({
    field: null,
    dir: null,
    type: null,
  });

  const d = dict[lang];

  const totalLines = rowsOriginal.length + errors.length;

  const stats = useMemo(() => {
    if (!filteredRows.length) {
      return { max: "–", avg: "–" };
    }

    const durations = filteredRows.map((r) => Number(r.Duration || 0));
    return {
      max: Math.max(...durations).toFixed(2),
      avg: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
    };
  }, [filteredRows]);

  const pageCount = Math.ceil(filteredRows.length / PAGE_SIZE);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  const parseText = (text) => {
    const normalized = String(text || "").replace(/}\s*{/g, "}\n{");
    const lines = normalized.split(/\r?\n/).filter((x) => x.trim());

    const nextRows = [];
    const nextErrors = [];

    lines.forEach((line, index) => {
      try {
        const obj = JSON.parse(line.trim());
        nextRows.push(flattenRow(obj));
      } catch (e) {
        nextErrors.push(`Line ${index + 1}: ${e.message}`);
      }
    });

    setRowsOriginal(nextRows);
    setFilteredRows(nextRows);
    setErrors(nextErrors);
    setExpandedIndex(null);
    setCurrentPage(1);
    setSortState({ field: null, dir: null, type: null });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      parseText(event.target?.result || "");
    };
    reader.readAsText(file);
  };

  const applySearch = () => {
    let next = [...rowsOriginal];

    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      next = next.filter((r) =>
        String(r[searchColumn] ?? "")
          .toLowerCase()
          .includes(q),
      );
    }

    if (sortState.field) {
      next.sort((a, b) => {
        const dir = sortState.dir === "asc" ? 1 : -1;
        if (sortState.type === "number") {
          return (
            (Number(a[sortState.field] || 0) -
              Number(b[sortState.field] || 0)) *
            dir
          );
        }
        return (
          String(a[sortState.field] || "").localeCompare(
            String(b[sortState.field] || ""),
          ) * dir
        );
      });
    }

    setFilteredRows(next);
    setExpandedIndex(null);
    setCurrentPage(1);
  };

  const resetSorting = () => {
    setSortState({ field: null, dir: null, type: null });
    setFilteredRows([...rowsOriginal]);
    setExpandedIndex(null);
    setCurrentPage(1);
  };

  const sortColumn = (field, type) => {
    const nextSort =
      sortState.field === field
        ? { ...sortState, dir: sortState.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc", type };

    const next = [...filteredRows].sort((a, b) => {
      const dir = nextSort.dir === "asc" ? 1 : -1;
      if (type === "number") {
        return (Number(a[field] || 0) - Number(b[field] || 0)) * dir;
      }
      return String(a[field] || "").localeCompare(String(b[field] || "")) * dir;
    });

    setSortState(nextSort);
    setFilteredRows(next);
    setExpandedIndex(null);
    setCurrentPage(1);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Paper variant='outlined' sx={{ p: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent='space-between'
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Typography variant='h5'>{d.title}</Typography>

            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={lang}
                label='Language'
                onChange={(e) => setLang(e.target.value)}
              >
                <MenuItem value='en'>English</MenuItem>
                <MenuItem value='uk'>Українська</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        <Paper variant='outlined' sx={{ p: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            flexWrap='wrap'
          >
            <Button
              variant='contained'
              onClick={() => setShowTextInput((v) => !v)}
            >
              {showTextInput ? d.hideTextInput : d.showTextInput}
            </Button>

            <Button variant='outlined' component='label'>
              {d.parseFile}
              <input
                hidden
                type='file'
                accept='.json,.txt'
                onChange={handleFileChange}
              />
            </Button>

            <Button variant='outlined' onClick={() => parseText(rawInput)}>
              {d.parseText}
            </Button>

            <Button variant='text' onClick={resetSorting}>
              {d.resetSorting}
            </Button>

            {!!selectedFileName && (
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ alignSelf: "center" }}
              >
                {selectedFileName}
              </Typography>
            )}
          </Stack>

          {showTextInput && (
            <Box sx={{ mt: 2 }}>
              <TextField
                multiline
                minRows={10}
                fullWidth
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={d.pasteLogsHere}
              />
            </Box>
          )}

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            sx={{ mt: 2 }}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <FormControl size='small' sx={{ minWidth: 180 }}>
              <InputLabel>Column</InputLabel>
              <Select
                value={searchColumn}
                label='Column'
                onChange={(e) => setSearchColumn(e.target.value)}
              >
                <MenuItem value='Duration'>Duration</MenuItem>
                <MenuItem value='Code'>Code</MenuItem>
                <MenuItem value='StartedOn'>StartedOn</MenuItem>
                <MenuItem value='Id'>Id</MenuItem>
                <MenuItem value='ParentId'>ParentId</MenuItem>
                <MenuItem value='SQLText'>SQLText</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size='small'
              fullWidth
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={d.searchPlaceholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
            />

            <Button variant='contained' onClick={applySearch}>
              {d.search}
            </Button>
          </Stack>
        </Paper>

        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <StatCard label={d.totalLines} value={totalLines} />
          <StatCard label={d.valid} value={rowsOriginal.length} />
          <StatCard label={d.errors} value={errors.length} />
          <StatCard label={d.found} value={filteredRows.length} />
          <StatCard label={d.maxDuration} value={stats.max} />
          <StatCard label={d.avgDuration} value={stats.avg} />
        </Stack>

        <CodeBreakdown rows={filteredRows} label={d.codeBreakdown} />

        {!!errors.length && (
          <Paper variant='outlined' sx={{ p: 2 }}>
            <Typography variant='subtitle1' gutterBottom color='error'>
              {d.errors}
            </Typography>
            <Box
              component='pre'
              sx={{
                m: 0,
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: 13,
                color: "error.main",
              }}
            >
              {errors.join("\n")}
            </Box>
          </Paper>
        )}

        <Paper variant='outlined' sx={{ overflowX: "auto" }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <SortableHeader
                  label='Duration'
                  field='Duration'
                  sortState={sortState}
                  onSort={() => sortColumn("Duration", "number")}
                />
                <SortableHeader
                  label='Code'
                  field='Code'
                  sortState={sortState}
                  onSort={() => sortColumn("Code", "string")}
                />
                <SortableHeader
                  label='StartedOn'
                  field='StartedOn'
                  sortState={sortState}
                  onSort={() => sortColumn("StartedOn", "string")}
                />
                <SortableHeader
                  label='Id'
                  field='Id'
                  sortState={sortState}
                  onSort={() => sortColumn("Id", "string")}
                />
                <SortableHeader
                  label='ParentId'
                  field='ParentId'
                  sortState={sortState}
                  onSort={() => sortColumn("ParentId", "string")}
                />
                <SortableHeader
                  label='SQLText'
                  field='SQLText'
                  sortState={sortState}
                  onSort={() => sortColumn("SQLText", "string")}
                />
                <TableCell sx={{ fontWeight: 600 }}>{d.details}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!filteredRows.length ? (
                <TableRow>
                  <TableCell colSpan={7}>{d.noData}</TableCell>
                </TableRow>
              ) : (
                pagedRows.map((row, idx) => {
                  const full = row.__full;
                  const globalIndex = (currentPage - 1) * PAGE_SIZE + idx;
                  const isExpanded = expandedIndex === globalIndex;

                  return (
                    <React.Fragment key={`${row.Id}-${globalIndex}`}>
                      <TableRow hover>
                        <TableCell>
                          <DurationChip value={full.Duration} />
                        </TableCell>
                        <TableCell>{full.Code}</TableCell>
                        <TableCell>{full.StartedOn}</TableCell>
                        <TableCell>{full.Id}</TableCell>
                        <TableCell>{full.ParentId}</TableCell>
                        <TableCell sx={{ maxWidth: 500 }}>
                          <Box
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {(full.Data?.SQLText || "")
                              .replace(/\s+/g, " ")
                              .trim()}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={() =>
                              setExpandedIndex(isExpanded ? null : globalIndex)
                            }
                          >
                            {d.details}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ bgcolor: "grey.50" }}>
                            <Box sx={{ py: 1 }}>
                              <DetailsPanel item={full} lang={lang} />
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Paper>

        {pageCount > 1 && (
          <Stack direction='row' justifyContent='center'>
            <Pagination
              color='primary'
              page={currentPage}
              count={pageCount}
              onChange={(_, page) => {
                setCurrentPage(page);
                setExpandedIndex(null);
              }}
            />
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
