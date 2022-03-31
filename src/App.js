import React, { useEffect, useState } from 'react';
import './App.css';
import ThreeImporter from './ThreeImporter';
import * as bimU from 'bimu.io.viewer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import { REGULATIONS } from './safetyRegulationConfig';
import { isTwoPointsTooClose } from './ViewerHelper';

const onError = (e) => console.error(e);

const App = () => {
  const classes = useStyles();
  const urlParams = new URLSearchParams(window.location.search);

  const [modelRegulation, setModelRegulation] = useState({});
  const [currentTags, setCurrentTags] = useState([]);
  const [headerContent, setHeaderContent] = useState();

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

      viewer.getElementDataByProperty([propertyFilter1], [propertySelector1, propertySelector2, propertySelector3], 1000, (data) => {
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

        //add tags
        Object.keys(regulations).map((k) => {
          addTagsByRegulation(viewer, k, regulations[k]);
        });
      }, onError);
    };

    // Load a model
    viewer.loadModel(modelConfigs, onPorgress, onLoaded, onError);
  }, []);

  const addTagsByRegulation = (viewer, number, regulation) => {
    // Filter out safety elements
    let propertyFilter1 = new bimU.PropertyFilter("Text", "勞安_法規內容", regulation);
    propertyFilter1.operator = bimU.OperatorsEnum.CONTAINS;
    // Return element index
    let propertySelector1 = new bimU.PropertySelector(null, "eIdx");

    viewer.getElementDataByProperty([propertyFilter1], [propertySelector1], 1000, (data) => {
      //console.log(data);
      viewer.resetVisibility();
      let elementIndexArray = data.map(element => Number(element.eIdx));
      // viewer.setColor(elementIndexArray, new window.THREE.Color(0xff0000));
      let bbox = viewer.getBoundingBox(elementIndexArray);
      let centroid = new window.THREE.Vector3();
      bbox.getCenter(centroid);
      let location = new window.THREE.Vector3(bbox.max.x, bbox.max.y, bbox.max.z + 0.25);
      // Offset location if there is tag already
      currentTags.map((t)=>{
        if(isTwoPointsTooClose(t.location, location, 0.5)){
          location.z+=0.4;
        }
      });
      let uuid = viewer.addTag(number, location, { fontSize: 50 }, () => {
        viewer.showDialog("", regulation, "關閉", null, null, true);
      });
      
      let tags = currentTags;
      tags.push({uuid: uuid, location: location, number: number, regulation: regulation, elementIndexArray: elementIndexArray});
      setCurrentTags(tags);
    }, onError);
  };

  useEffect(() => {
    Object.keys(modelRegulation).map((k) => {
      window.viewer.addCustomButton(`regulation_${k}`, `collection-item-${k}`, "#e91e63", `${modelRegulation[k]}`, () => highlightElements(window.viewer, k, modelRegulation[k]));
    });

  }, [modelRegulation]);

  const highlightElements = (viewer, number, regulation) => {
    setHeaderContent(regulation);
    // Filter out safety elements
    let propertyFilter1 = new bimU.PropertyFilter("Text", "勞安_法規內容", regulation);
    propertyFilter1.operator = bimU.OperatorsEnum.CONTAINS;
    // Return element index
    let propertySelector1 = new bimU.PropertySelector(null, "eIdx");
    viewer.getElementDataByProperty([propertyFilter1], [propertySelector1], 1000, (data) => {
      //console.log(data);
      viewer.resetVisibility();
      let elementIndexArray = data.map(element => Number(element.eIdx));
      viewer.setColor(elementIndexArray, new window.THREE.Color(0xff0000));

      let bbox = viewer.getBoundingBox(elementIndexArray);
      viewer.setSectionBox(bbox.min, bbox.max);
      viewer.toggleSectionbox(true);
      viewer.zoomToFit();
      viewer.toggleSectionbox(false);
      setTimeout(()=>{viewer.resetVisibility();}, 1000);

    }, onError);
  }



  return (
    <React.Fragment>
      <Box position="relative" style={{ width: window.innerWidth, height: window.innerHeight }}>
        <Box id="viewer-overlay" className={classes.viewerOverlay}>
          <Typography variant="h6" gutterBottom component="div">
            {headerContent}
          </Typography>
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
    paddingLeft: '15px',
    paddingRight: '15px',
    backgroundColor: 'rgba(40, 215, 107, 0.46)',
  },
  viewerContainer: {
    textAlign: 'center',
    width: '100%',
    height: '100%',
  }
}));

export default App;
