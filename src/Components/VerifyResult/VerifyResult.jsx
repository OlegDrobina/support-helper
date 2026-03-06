import { Typography, Link } from "@mui/material";

const VerifyResult = () => {
  return (
    <Typography variant='body2' align='center'>
      Please validate the result using{" "}
      <Link
        href='https://jsonformatter.curiousconcept.com/#'
        target='_blank'
        rel='noopener noreferrer'
      >
        this link
      </Link>
      .
    </Typography>
  );
};

export default VerifyResult;
