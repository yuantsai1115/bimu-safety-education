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


const onError = (e) => console.error(e);

const App = () => {
  const classes = useStyles();
  const urlParams = new URLSearchParams(window.location.search);

  const [modelRegulation, setModelRegulation] = useState({});
  const [currentTags, setCurrentTags] = useState([]);
  const [headerContent, setHeaderContent] = useState();
  const [showPreloader, setShowPreloader] = useState(false);

  useEffect(() => {
    // Viewer configuration object
    let viewerConfigs = {
      domElementId: "viewer",
      showUI: true
    };

    // Initialise a Viewer 
    let viewer = new bimU.Viewer(viewerConfigs);
    viewer.initialize();
    window.viewer = viewer;

    // Register selection event
    let selectedElementIndices;
    viewer.addEventListener(bimU.EventsEnum.ON_SELECTION_CHANGED, (e) => {
      // Cache selected element indices	
      selectedElementIndices = e.selectedElementIndices;
    });


    // viewer.addCustomButton("button-setColor", "flare", "#e91e63", "Highlight", () => {
    //   if (!selectedElementIndices || selectedElementIndices.length === 0) {
    //     viewer.showDialog("Warning", "No element is selected.", "Close", null, null, true);
    //     return;
    //   }
    //   viewer.resetVisibility();
    //   console.log(selectedElementIndices);
    //   viewer.setColor(selectedElementIndices, new window.THREE.Color(0xff0000));

    // });

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
    let onLoaded = (e) => {
      console.log(e);
      viewer.closeDialog();

      // Filter out safety elements
      let propertyFilter1 = new bimU.PropertyFilter("Text", "勞安_法規內容", null);
      propertyFilter1.operator = bimU.OperatorsEnum.NOT_EQUAL_TO;
      // Return element index
      let propertySelector1 = new bimU.PropertySelector(null, "eIdx");
      let propertySelector2 = new bimU.PropertySelector("Text", "勞安_法規內容");
      let propertySelector3 = new bimU.PropertySelector("Text", "勞安_法規編號");

      viewer.getElementDataByProperty([propertyFilter1], [propertySelector1, propertySelector2, propertySelector3], 1000, async (data) => {
        //console.log(data);
        let regulations = {};
        data.map((d) => {
          let n = d.勞安_法規編號.split('@');
          let r = d.勞安_法規內容.split('@');
          n.map((num, index) => {
            regulations[num] = r[index];
          });
        });
        //console.log(regulations);
        setModelRegulation(regulations);
        
        //add tags and buttons
        addTagsAndButtonsByRegulations(viewer, regulations);
        
      }, onError);
    };

    // Load a model
    viewer.loadModel(modelConfigs, onPorgress, onLoaded, onError);
  }, []);

  const addTagsAndButtonsByRegulations = async (viewer, regulations) => {
    let tags = [];
    //get eIdx by regulations
    let selectExpression = `"eIdx" AS "eIdx", "Text:勞安_法規編號" AS "勞安_法規編號"`;
    let filterExpressions = [];
    Object.keys(regulations).map((n) => {
      filterExpressions.push(`"Text:勞安_法規內容" LIKE '%${regulations[n]}%'`);
    });
    let filterExpression = `${filterExpressions.join(' OR ')}`;

    viewer.getElementDataByQuery(filterExpression, selectExpression, 1000, (data) => {
      // console.log(data);
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

      // add tags
      viewer.resetVisibility();
      Object.keys(eIdxByRegulation).map((number) => {
        let elementIndexArray = eIdxByRegulation[number];
        let regulation = regulations[number];
        let bbox = viewer.getBoundingBox(elementIndexArray);
        let centroid = new window.THREE.Vector3();
        bbox.getCenter(centroid);
        let location = new window.THREE.Vector3(bbox.max.x, bbox.max.y, bbox.max.z + 0.25);
        tags.map((t) => {
          if (isTwoPointsTooClose(t.location, location, 0.5)) {
            location.z += 0.4;
          }
        });
        let uuid = viewer.addTag(number, location, { fontSize: 50 }, () => {
          viewer.showDialog("", regulation, "關閉", null, null, true);
        });
        tags.push({ uuid: uuid, location: location, number: number, regulation: regulation, elementIndexArray: elementIndexArray });
      });

      //add custom buttons
      Object.keys(regulations).map((k) => {
        viewer.addCustomButton(`regulation_${k}`, `collection-item-${k}`, "#e91e63", k, () => highlightElements(viewer, k, regulations[k], tags));
      });

      setCurrentTags(tags);
      setShowPreloader(false);
    }, onError);
   
  }

  const highlightElements = (viewer, number, regulation, tags) => {
    setHeaderContent(`[${number}] ${regulation}`);
    let elementIndexArray = [];
    tags.map((t) => {
      if (number == t.number) {
        elementIndexArray = t.elementIndexArray;
      }
    });

    viewer.setColor(elementIndexArray, new window.THREE.Color(0xff0000));

    let bbox = viewer.getBoundingBox(elementIndexArray);
    viewer.setSectionBox(bbox.min, bbox.max);
    viewer.toggleSectionbox(true);
    viewer.zoomToFit();
    viewer.toggleSectionbox(false);
    setTimeout(() => { viewer.resetVisibility(); }, 1000);
  }



  return (
    <React.Fragment>
      <Box position="relative" style={{ width: window.innerWidth, height: window.innerHeight }}>
        <Box id="viewer-overlay" className={classes.viewerOverlay}>
          <Typography variant="h6" className={classes.headerContent} gutterBottom component="div">
            {headerContent}
          </Typography>
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
