import { useState } from "react";
import { TextField, Button, Box, Stack, Snackbar } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import VerifyResult from "../VerifyResult/VerifyResult";
import logo from "../../assets/creatio-logo.png";

const GSSettingValueFormer = () => {
  //Control state of the input fields
  const [objectName, setObjectName] = useState("");
  const [initialGSSettingValue, setInitialGSSettingValue] = useState("");
  const [metaData, setMetaData] = useState("");
  const [columnsToLeave, setColumnsToLeave] = useState("");
  const [processingResult, setProcessingResult] = useState("");
  const [copied, setCopied] = useState(false);
  //End control state of the input fields

  //Controls the editability of the process button
  const isFormComplete =
    objectName.trim() &&
    initialGSSettingValue.trim() &&
    metaData.trim() &&
    columnsToLeave.trim();
  //End controls the editability of the process button

  //Error message processing
  const showError = (errorMessage) => {
    toast.error(errorMessage || "Something went wrong!", {
      position: "bottom-left",
      autoClose: 1500,
      theme: "colored",
    });
  };
  //End error message processing

  //Process received data
  const safeCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (err) {
      // Fallback for insecure contexts (HTTP)
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (e) {
        console.error("Fallback copy failed", e);
      }
      document.body.removeChild(textarea);
      setCopied(true);
    }
  };

  const processReceivedData = () => {
    const isObjectNameValid = validateReceivedObjectName();
    const isSysSettingValueValid = validateReceivedSysSettingValue();
    const isMetaDataValid = validateReceivedMetaData();
    let validationMessage = "";
    if (
      isObjectNameValid !== true ||
      isSysSettingValueValid !== true ||
      isMetaDataValid != true
    ) {
      validationMessage = formValidationMessage(
        isObjectNameValid,
        isSysSettingValueValid,
        isMetaDataValid,
      );
      showError(validationMessage);
    } else {
      internalProcess();
    }
  };

  const formValidationMessage = (
    isObjectNameValid,
    isSysSettingValueValid,
    isMetaDataValid,
  ) => {
    let errorMessage = "";
    if (isObjectNameValid != true) {
      errorMessage = isObjectNameValid;
    } else if (isSysSettingValueValid != true) {
      errorMessage = isSysSettingValueValid;
    } else {
      errorMessage = isMetaDataValid;
    }
    return errorMessage;
  };

  const validateReceivedObjectName = () => {
    const receivedObjectName = getInputObjectName();
    const isObjectNameFilledIn = verifyObjectNameFilledIn(receivedObjectName);
    return isObjectNameFilledIn ? true : "Object name is empty";
  };

  const getInputObjectName = () => {
    const objectNameVal = objectName?.trim();
    return objectNameVal;
  };

  const verifyObjectNameFilledIn = (objectName) => {
    return objectName?.trim()?.length !== 0;
  };

  const validateReceivedSysSettingValue = () => {
    const sysSettingValue = initialGSSettingValue;
    const beautifiedValue = beautifyPassedSysSettingValue(sysSettingValue);
    const isValidSysSettingValue = verifySysSettingOrigValue(beautifiedValue);
    return isValidSysSettingValue;
  };

  const beautifyPassedSysSettingValue = (value) => {
    let beautifiedValue = value.replaceAll("\t", "");
    beautifiedValue = beautifiedValue.replaceAll(
      "IgnoredColumns",
      '"IgnoredColumns"',
    );
    return beautifiedValue;
  };

  const verifySysSettingOrigValue = (sysSettingValue) => {
    return isJson(sysSettingValue)
      ? true
      : "Provided SysSettingValue is not a valid JSON";
  };

  const validateReceivedMetaData = () => {
    const metaDataValue = metaData;
    const isValidMetaData = verifyReceivedMetaData(metaDataValue);
    return isValidMetaData;
  };

  const verifyReceivedMetaData = (metaDataValue) => {
    return isJson(metaDataValue)
      ? verifyMetaDataColumnsProp(metaDataValue)
      : "Provided metadata is not a JSON string";
  };

  const verifyMetaDataColumnsProp = (metaDataValue) => {
    const metaDataValueJSON = JSON.parse(metaDataValue);
    return metaDataValueJSON.MetaData?.Schema?.hasOwnProperty("Columns")
      ? true
      : 'Provided metadata has no "Columns" property';
  };

  const isJson = (item) => {
    let value = typeof item !== "string" ? JSON.stringify(item) : item;
    try {
      value = JSON.parse(value);
    } catch (e) {
      return false;
    }

    return typeof value === "object" && value !== null;
  };
  const internalProcess = () => {
    const passedObjectName = getInputObjectName();
    const passedSysSettingValue = initialGSSettingValue;
    const processedSysSettingValue = beautifyPassedSysSettingValue(
      passedSysSettingValue,
    );
    const processedSysSettingValueObj = JSON.parse(processedSysSettingValue);
    const passedMetaData = metaData;
    const processedMetaDataValueObj = JSON.parse(passedMetaData);
    const ignoreColumnNames = formIgnoredColumns(processedMetaDataValueObj);
    const resultSysSettingValueJSON = checkIfObjectExistsInTheSetting(
      passedObjectName,
      processedSysSettingValueObj,
    )
      ? addIngoredColumnsIntoObjectProperty(
          passedObjectName,
          processedSysSettingValueObj,
          ignoreColumnNames,
        )
      : createProperyInSysSettingValue(
          passedObjectName,
          processedSysSettingValueObj,
          ignoreColumnNames,
        );
    const resultSysSettingValue = JSON.stringify(resultSysSettingValueJSON);
    setProcessingResult(resultSysSettingValue);
  };
  const checkIfObjectExistsInTheSetting = (objectName, sysSettingValue) =>
    sysSettingValue.hasOwnProperty(objectName);

  const addIngoredColumnsIntoObjectProperty = (
    objectName,
    sysSettingValue,
    ignoredColumns,
  ) => {
    sysSettingValue[objectName].IgnoredColumns = ignoredColumns;
    return sysSettingValue;
  };

  const createProperyInSysSettingValue = (
    objectName,
    sysSettingValue,
    ignoredColumns,
  ) => {
    sysSettingValue[objectName] = {};
    sysSettingValue[objectName].IgnoredColumns = ignoredColumns;
    return sysSettingValue;
  };

  const formIgnoredColumns = (passedObj) => {
    const columnObjectsArray = passedObj.MetaData.Schema.Columns;
    const columnNames = columnObjectsArray
      .map((item) => item.Name)
      .filter(ignoredColumnsFiltration);
    return columnNames;
  };

  const getHasIgnoredColumns = () => {
    const ignoredColumns = columnsToLeave;
    return ignoredColumns.length != 0;
  };

  const ignoredColumnsFiltration = (item) => {
    if (getHasIgnoredColumns()) {
      const ignoredColumns = columnsToLeave;
      return item != "Id" && item != "Name" && !ignoredColumns.includes(item);
    } else {
      return item != "Id" && item != "Name";
    }
  };
  //End process received data

  return (
    <Box
      sx={{
        paddingTop: 30,
        paddingBottom: 30,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Box
        sx={{
          width: 400,
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: "white",
        }}
      >
        <img
          src={logo}
          alt='Logo'
          style={{
            width: 220,
            marginBottom: 24,
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />
        <Stack spacing={2}>
          <TextField
            label='Object name to process'
            id='object-name-input-id'
            variant='outlined'
            required={objectName.trim() === ""}
            value={objectName}
            onChange={(e) => setObjectName(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label='Initial GS Setting Value'
            id='initial-gs-setting-value-input-id'
            variant='outlined'
            required={initialGSSettingValue.trim() === ""}
            value={initialGSSettingValue}
            onChange={(e) => setInitialGSSettingValue(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label='Meta data (read-only)'
            id='meta-data-read-only-id'
            variant='outlined'
            required={metaData.trim() === ""}
            value={metaData}
            onChange={(e) => setMetaData(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label='Columns that should be left'
            id='columns-to-leave-id'
            variant='outlined'
            required={columnsToLeave.trim() === ""}
            value={columnsToLeave}
            onChange={(e) => setColumnsToLeave(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <Button
            variant='contained'
            color='success'
            disabled={!isFormComplete}
            onClick={processReceivedData}
          >
            Process
          </Button>
          <ToastContainer />
          <TextField
            label='Result'
            id='processing-result-id'
            variant='outlined'
            value={processingResult}
            onChange={(e) => setProcessingResult(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <Button
            variant='contained'
            color='primary'
            onClick={() => safeCopy(processingResult)}
            disabled={!processingResult.trim()}
          >
            Copy to Clipboard
          </Button>
          <Snackbar
            open={copied}
            autoHideDuration={2000}
            onClose={() => setCopied(false)}
            message='Copied!'
          />
          <VerifyResult />
        </Stack>
      </Box>
    </Box>
  );
};

export default GSSettingValueFormer;
