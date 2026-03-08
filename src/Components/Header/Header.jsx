import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Box,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import { useState } from "react";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import SettingsIcon from "@mui/icons-material/Settings";
import BugReportIcon from "@mui/icons-material/BugReport";
import ScheduleIcon from "@mui/icons-material/Schedule";
import LinkIcon from "@mui/icons-material/Link";

const expandedDrawerWidth = 250;
const collapsedDrawerWidth = 64;

const Header = () => {
  const [collapsed, setCollapsed] = useState(false);

  const [gsSelected, setGsSelected] = useState(false);
  const [traceSelected, setTraceSelected] = useState(false);
  const [schedulerSelected, setSchedulerSelected] = useState(false);
  const [usefulLinksSelected, setUsefulLinksSelected] = useState(false);

  const currentDrawerWidth = collapsed
    ? collapsedDrawerWidth
    : expandedDrawerWidth;

  const itemSx = {
    justifyContent: collapsed ? "center" : "flex-start",
    px: 2,
    "&.Mui-selected": {
      backgroundColor: "#8d86a3",
    },
    "&.Mui-focusVisible": {
      backgroundColor: "#aba7df",
    },
    "&:hover": {
      backgroundColor: "#aba7df",
    },
    "&.Mui-selected:hover": {
      backgroundColor: "#8d86a3",
    },
  };

  const iconSx = {
    minWidth: 0,
    mr: collapsed ? 0 : 2,
    justifyContent: "center",
    color: "white",
  };

  const textSx = {
    display: collapsed ? "none" : "block",
    whiteSpace: "nowrap",
  };

  return (
    <Drawer
      variant='permanent'
      anchor='left'
      sx={{
        width: currentDrawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: currentDrawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#0a0a0a",
          color: "white",
          overflowX: "hidden",
          transition: "width 0.2s ease",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: collapsed ? "center" : "flex-end",
          p: 1,
        }}
      >
        <IconButton
          onClick={() => setCollapsed((prev) => !prev)}
          sx={{ color: "white" }}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <List>
        <ListItemButton
          selected={gsSelected}
          onClick={() => {
            setGsSelected(true);
            setTraceSelected(false);
            setSchedulerSelected(false);
            setUsefulLinksSelected(false);
          }}
          sx={itemSx}
          component={NavLink}
          to='/gsvalueformer'
        >
          <ListItemIcon sx={iconSx}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary='GS value former' sx={textSx} />
        </ListItemButton>

        <ListItemButton
          selected={traceSelected}
          onClick={() => {
            setTraceSelected(true);
            setGsSelected(false);
            setSchedulerSelected(false);
            setUsefulLinksSelected(false);
          }}
          sx={itemSx}
          component={NavLink}
          to='/traceanalyzer'
        >
          <ListItemIcon sx={iconSx}>
            <BugReportIcon />
          </ListItemIcon>
          <ListItemText primary='Trace analyzer' sx={textSx} />
        </ListItemButton>

        <ListItemButton
          selected={schedulerSelected}
          onClick={() => {
            setSchedulerSelected(true);
            setGsSelected(false);
            setTraceSelected(false);
            setUsefulLinksSelected(false);
          }}
          sx={itemSx}
          component={NavLink}
          to='/schedulerloganalyzer'
        >
          <ListItemIcon sx={iconSx}>
            <ScheduleIcon />
          </ListItemIcon>
          <ListItemText primary='Scheduler log analyzer' sx={textSx} />
        </ListItemButton>

        <ListItemButton
          selected={usefulLinksSelected}
          onClick={() => {
            setUsefulLinksSelected(true);
            setGsSelected(false);
            setTraceSelected(false);
            setSchedulerSelected(false);
          }}
          sx={itemSx}
          component={NavLink}
          to='/usefullinks'
        >
          <ListItemIcon sx={iconSx}>
            <LinkIcon />
          </ListItemIcon>
          <ListItemText primary='Useful links' sx={textSx} />
        </ListItemButton>
      </List>
    </Drawer>
  );
};

export default Header;
