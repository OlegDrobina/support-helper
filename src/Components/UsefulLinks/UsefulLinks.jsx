import {
  Box,
  Paper,
  Typography,
  Stack,
  Link,
  Divider,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const links = [
  {
    category: "General Creatio links",
    items: [
      {
        title: "Creatio Academy",
        url: "https://academy.creatio.com",
      },
      {
        title: "Creatio Documentation",
        url: "https://academy.creatio.com/docs",
      },
    ],
  },
  {
    category: "Internal documentation links",
    items: [
      {
        title: "Scrum teams",
        url: "https://creatio.atlassian.net/wiki/spaces/TER/pages/2314665990/scrum+teams",
      },
      {
        title: "Business logic tracing in Creatio",
        url: "https://creatio.atlassian.net/wiki/spaces/TER/pages/2819391529/Business+logic+tracing+in+creatio.+Tracing+of+slow+application+places",
      },
      {
        title: "Primary thread pool setup",
        url: "https://creatio.atlassian.net/wiki/spaces/TER/pages/2456552384/.NET+Framework",
      },
    ],
  },
  {
    category: "Checklists",
    items: [
      {
        title: "Identity service (OAUTH) checklist",
        url: "https://creatio.atlassian.net/wiki/spaces/KB/pages/2453373159/Identity+Service+OAuth+Check-list",
      },
      {
        title: "QUARTZ checklist",
        url: "https://creatio.atlassian.net/wiki/spaces/kb/pages/2355692956/-+Quartz",
      },
      {
        title: "Global search and deduplication service checklist",
        url: "https://creatio.atlassian.net/wiki/spaces/KB/pages/2497544197/-+1",
      },
    ],
  },
];

export default function UsefulLinks() {
  return (
    <Box>
      <Typography variant='h5' sx={{ mb: 2 }}>
        Useful links
      </Typography>

      <Stack spacing={2}>
        {links.map((group) => (
          <Paper key={group.category} variant='outlined' sx={{ p: 2 }}>
            <Typography variant='h6' sx={{ mb: 1 }}>
              {group.category}
            </Typography>

            <Divider sx={{ mb: 1 }} />

            <List>
              {group.items.map((link) => (
                <ListItemButton
                  key={link.url}
                  component='a'
                  href={link.url}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <ListItemText primary={link.title} />
                  <OpenInNewIcon fontSize='small' />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
