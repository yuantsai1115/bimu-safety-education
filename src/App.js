import React, { useEffect, useState } from 'react';
import './App.css';
import ThreeImporter from './ThreeImporter';
import * as bimU from 'bimu.io.viewer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import { REGULATIONS } from './safetyRegulationConfig';
import { isTwoPointsTooClose } from './ViewerHelper';
import CircularProgress from '@mui/material/CircularProgress';
import { highlightElements, getRegulations, addTags, addRegulationButtons } from './helpers/bimuHelper'
import BimuManager from './services/BimuManager';
import { stepContentClasses } from '@mui/material';


const onError = (e) => console.error(e);

// Viewer configuration object
const VIEWER_CONFIG = {
  domElementId: "viewer",
  showUI: true
};


const App = () => {
  const classes = useStyles();
  const urlParams = new URLSearchParams(window.location.search);
  const imgFolder = !!urlParams.get('imgFolder') ? urlParams.get('imgFolder') : undefined;

  const [modelRegulation, setModelRegulation] = useState({});
  const [currentTags, setCurrentTags] = useState([]);
  const [headerContent, setHeaderContent] = useState();
  const [showPreloader, setShowPreloader] = useState(false);

  useEffect(() => {
    // Initialise a Viewer
    let selectedElementIndices;
    let viewer = BimuManager.initViewer(VIEWER_CONFIG, selectedElementIndices);
    viewer.addCustomButton(`clear-header`, `iridescent`, "#e91e63", "隱藏說明", () => {
      setHeaderContent();
    });
    // Model configuration object
    let modelConfigs = {
      modelId: urlParams.get('modelId') || "624526f956bd8600048c99ca",
      // Either access token or password must be specified
      password: "",
      // accessToken: "YOUR_ACCESS_TOKEN"
    };

    // Callbacks
    let onPorgress = (e) => {
      console.log(e);
      setShowPreloader(true);
      viewer.showDialog("Loading...", "Progress:" + e.progress, "Close", null, null, true);
    };
    let onLoaded = async (e) => {
      console.log(e);
      viewer.closeDialog();

      // Filter out safety elements
      let propertyFilter1 = new bimU.PropertyFilter("Text", "勞安_法規內容", null);
      propertyFilter1.operator = bimU.OperatorsEnum.NOT_EQUAL_TO;
      // Return element index
      let propertySelector1 = new bimU.PropertySelector(null, "eIdx");
      let propertySelector2 = new bimU.PropertySelector("Text", "勞安_法規內容");
      let propertySelector3 = new bimU.PropertySelector("Text", "勞安_法規編號");
      let propertySelector4 = new bimU.PropertySelector("Text", "勞安_法規圖片");

      viewer.getElementDataByProperty([propertyFilter1],
        [propertySelector1, propertySelector2, propertySelector3, propertySelector4],
        1000,
        async (data) => {
          let regulations = {};
          let images = {};
          data.map((d) => {
            let n = d.勞安_法規編號.split('@');
            let r = d.勞安_法規內容.split('@');
            let img = !!d.勞安_法規圖片 ? d.勞安_法規圖片.split('@') : undefined;
            n.map((num, index) => {
              regulations[num] = r[index];
              images[num] = !!img ? img[index] : '0';
            });
          });
          console.log(regulations);
          setModelRegulation(regulations);

          //add tags and buttons
          addTagsAndButtonsByRegulations(viewer, regulations, images);

        }, onError);
    };

    // Load a model
    viewer.loadModel(modelConfigs, onPorgress, onLoaded, onError);
  }, []);

  const addTagsAndButtonsByRegulations = async (viewer, regulations, images) => {
    //get eIdx by regulations
    let selectExpression = `"eIdx" AS "eIdx", "Text:勞安_法規編號" AS "勞安_法規編號"`;
    let filterExpressions = [];
    Object.keys(regulations).map((n) => {
      filterExpressions.push(`"Text:勞安_法規內容" LIKE '%${regulations[n]}%'`);
    });
    let filterExpression = `${filterExpressions.join(' OR ')}`;

    viewer.getElementDataByQuery(filterExpression, selectExpression, 1000, (data) => {
      console.log(data);
      let eIdxByRegulation = {};
      data.map((d) => {
        d.勞安_法規編號.split('@').map((number) => {
          if (Array.isArray(eIdxByRegulation[number])) {
            eIdxByRegulation[number].push(parseInt(d.eIdx));
          } else {
            eIdxByRegulation[number] = [parseInt(d.eIdx)];
          }
        });
      });
      // console.log(eIdxByRegulation);

      let tags = addTags(viewer, regulations, eIdxByRegulation, imgFolder, images);
      let contents = addRegulationButtons(classes, viewer, regulations,imgFolder, images, tags);

      setHeaderContent(contents);
      setCurrentTags(tags);
      setShowPreloader(false);
    }, onError);
  }

  return (
    <React.Fragment>
      <Box position="relative" style={{ width: window.innerWidth, height: window.innerHeight }}>
        <Box id="viewer-overlay" className={classes.viewerOverlay}>
          {headerContent}
          {showPreloader ? (
            <Box style={{ marginLeft: window.innerWidth / 2 - 20, marginTop: window.innerHeight / 2 - 20 }}>
              <CircularProgress />
            </Box>
          ) : undefined}
        </Box>
        <div id="viewer" className={classes.viewerContainer}></div>

      </Box>
    </React.Fragment>
  );
}

const useStyles = makeStyles((theme) => ({
  viewerOverlay: {
    zIndex: 50,
    position: 'absolute',
    width: 'auto',
    height: 'auto',
  },
  viewerContainer: {
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  headerContent: {
    backgroundColor: 'rgba(40, 215, 107, 0.46)',
    paddingLeft: '15px',
    paddingRight: '15px',
  }
}));

export default App;
