import React from "react";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import Button from "@mui/material/Button";
import { Formik } from "formik";
import { DBService } from "../../../services/db_communication";
import { useDispatch, useSelector } from "react-redux";
import DeleteIcon from "@mui/icons-material/Delete";
import { actionTypes } from "../../../store/actionTypes";
import { IConfirmationData } from "../../UIConfirmation/UIConfirmation";
import { useEffect } from "react";
import { DBActionTypes } from "../../../services/dbActionTypes";
import { EseverityTypes, ISnackbarData } from "../../SnackBar/SnackBar";
import { phaseDefinition } from "../../workflowItems/Phase/Phase";
import { Box } from "@mui/material";
import { formatCode, formatLabel } from "../../../utils/inputFormatter";

const useStyles = {
  root: {
    "& > *": {
      // m: 1,
      width: "65%",
    },
  },
  form: {
    display: "flex",
    m: "auto",
    flexFlow: "column",
    alignItems: "center",
  },
};

interface IPhaseForm {
  props: phaseDefinition;
}

const PhaseForm = ({ props }: IPhaseForm) => {
  const dispatch = useDispatch();
  const workflowData = useSelector((state) => state.workflowData);
  const appID = useSelector((state) => state.appData.appID);
  const classes = useStyles;

  const getNewSortOrder = (): number => {
    if (!workflowData.phases) return 1;
    const sortOrderArray: Array<number> = workflowData.phases?.map(
      (pha) => pha.sort_order
    );
    return Math.max(...sortOrderArray) + 1;
  };

  const [data, setData] = useState<phaseDefinition>({
    code: props?.code || "",
    label: props?.label || "",
    sort_order: props?.sort_order || getNewSortOrder(),
    id: props?.id || null,
    active_yn: props?.active_yn || null,
  });

  const snackbarData: ISnackbarData = {
    content: `Phase ${!data.id ? "created" : "updated"}!`,
    severity: EseverityTypes.success,
    show: true,
  };

  const saveData = async (formikData, setSubmitting) => {
    const phaseData = {
      ...data,
      app_id: appID,
    };

    const preparedDBData = {
      phases: [phaseData],
      change_type: DBActionTypes.updatePhases,
    };

    await DBService.changeData(preparedDBData)
      .then(() => {
        dispatch({ type: actionTypes.updateSnackbar, data: snackbarData });
        dispatch({ type: actionTypes.refresh });
      })
      .catch((err) => {
        console.error(err.message);
        dispatch({
          type: actionTypes.updateSnackbar,
          data: {
            ...snackbarData,
            severity: EseverityTypes.error,
            content: `Error ${!data.id ? "creating" : "updating"} phase! ${
              err.message
            }`,
          },
        });
      });

    setSubmitting(false);
    if (data.id) dispatch({ type: actionTypes.hideModal });
  };

  const deletePhase = async () => {
    console.log(
      JSON.stringify({
        change_type: DBActionTypes.removePhase,
        id: data.id,
      })
    );
    await DBService.changeData({
      change_type: DBActionTypes.removePhase,
      id: data.id,
    })
      .then(() => {
        dispatch({
          type: actionTypes.updateSnackbar,
          data: { ...snackbarData, content: "Phase deleted!" },
        });
        dispatch({ type: actionTypes.refresh });
        dispatch({ type: actionTypes.hideModal });
      })
      .catch((err) => {
        console.error(err.message);
        dispatch({
          type: actionTypes.updateSnackbar,
          data: {
            ...snackbarData,
            severity: EseverityTypes.error,
            content: `Error deleting action! ${err.message}`,
          },
        });
      });
  };

  const confirmData: IConfirmationData = {
    title: "Delete Phase?",
    description:
      "This action will delete all associated states and dependencies (actions, permissions..)",
    callback: deletePhase,
  };

  const tryDelete = () => {
    dispatch({ type: actionTypes.showConfirmation, data: confirmData });
  };

  // when adding new phases, keep increasing new sort order for quick batch insert
  useEffect(() => {
    if (!data.id) {
      setData({
        ...data,
        sort_order: getNewSortOrder(),
      });
    }
  }, [workflowData]);

  return (
    <Formik
      initialValues={data}
      onSubmit={(formikData, { setSubmitting }) =>
        saveData(formikData, setSubmitting)
      }
    >
      {({ handleSubmit, isSubmitting }) => (
        <Box
          sx={{
            ...classes.root,
            ...classes.form,
          }}
        >
          <TextField
            autoFocus
            id="phase-code"
            label="Code"
            variant="outlined"
            value={data.code}
            onChange={(e) =>
              setData({
                ...data,
                code: formatCode(e.target.value),
                label: data.id ? data.label : formatLabel(e.target.value),
              })
            }
            required
          />
          <TextField
            id="phase-label"
            label="Label"
            variant="outlined"
            value={data.label}
            onChange={(e) => setData({ ...data, label: e.target.value })}
            required
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: props?.id ? "space-between" : "right",
              m: "20px",
            }}
          >
            {props?.id ? (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={tryDelete}
                size="small"
              >
                delete
              </Button>
            ) : null}
            <Button
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              type="submit"
              size="small"
              onClick={handleSubmit}
            >
              Save
            </Button>
          </Box>
        </Box>
      )}
    </Formik>
  );
};

export default PhaseForm;
