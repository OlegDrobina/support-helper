import { Drawer, List, ListItemButton, ListItemText } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { css } from "@emotion/react";

const drawerWidth = 220;

const Header = () => {
  const [gsSelected, setGsSelected] = useState(false);
  const [traceSelected, setTraceSelected] = useState(false);
  const [schedulerSelected, setSchedulerSelected] = useState(false);
  const [usefulLinksSelected, setUsefulLinksSelected] = useState(false);

  return (
    <Drawer
      variant='permanent'
      anchor='left'
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#0a0a0a",
          color: "white",
        },
      }}
    >
      <List>
        <ListItemButton
          selected={gsSelected}
          onClick={() => {
            setGsSelected(true);
            setTraceSelected(false);
            setSchedulerSelected(false);
            setUsefulLinksSelected(false);
          }}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "#8d86a3",
            },
            "&.Mui-focusVisible": {
              backgroundColor: "#aba7df",
            },
            ":hover": {
              backgroundColor: "#aba7df",
            },
            "&.Mui-selected:hover": {
              backgroundColor: "#8d86a3",
            },
          }}
          component={NavLink}
          to='/gsvalueformer'
        >
          <ListItemText primary='GS value former' />
        </ListItemButton>

        <ListItemButton
          selected={traceSelected}
          onClick={() => {
            setTraceSelected(true);
            setGsSelected(false);
            setSchedulerSelected(false);
            setUsefulLinksSelected(false);
          }}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "#8d86a3",
            },
            "&.Mui-focusVisible": {
              backgroundColor: "#aba7df",
            },
            ":hover": {
              backgroundColor: "#aba7df",
            },
            "&.Mui-selected:hover": {
              backgroundColor: "#8d86a3",
            },
          }}
          component={NavLink}
          to='/traceanalyzer'
        >
          <ListItemText primary='Trace analyzer' />
        </ListItemButton>
        <ListItemButton
          selected={schedulerSelected}
          onClick={() => {
            setSchedulerSelected(true);
            setGsSelected(false);
            setTraceSelected(false);
            setUsefulLinksSelected(false);
          }}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "#8d86a3",
            },
            "&.Mui-focusVisible": {
              backgroundColor: "#aba7df",
            },
            ":hover": {
              backgroundColor: "#aba7df",
            },
            "&.Mui-selected:hover": {
              backgroundColor: "#8d86a3",
            },
          }}
          component={NavLink}
          to='/schedulerloganalyzer'
        >
          <ListItemText primary='Scheduler log analyzer' />
        </ListItemButton>
        <ListItemButton
          selected={usefulLinksSelected}
          onClick={() => {
            setUsefulLinksSelected(true);
            setGsSelected(false);
            setTraceSelected(false);
            setSchedulerSelected(false);
          }}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "#8d86a3",
            },
            "&.Mui-focusVisible": {
              backgroundColor: "#aba7df",
            },
            ":hover": {
              backgroundColor: "#aba7df",
            },
            "&.Mui-selected:hover": {
              backgroundColor: "#8d86a3",
            },
          }}
          component={NavLink}
          to='/usefullinks'
        >
          <ListItemText primary='Useful links' />
        </ListItemButton>
      </List>
    </Drawer>
  );
};

export default Header;
