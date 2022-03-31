import React, { useEffect } from 'react';
import './App.css';
import ThreeImporter from './ThreeImporter';
import * as bimU from 'bimu.io.viewer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';


const App = () => {
  const classes = useStyles();

  useEffect(() => {
    // Viewer configuration object
    let viewerConfigs = {
      domElementId: "viewer",
      showUI: true
    };

    // Initialise a Viewer 
    let viewer = new bimU.Viewer(viewerConfigs);
    viewer.initialize();

    // Model configuration object
    let modelConfigs = {
      modelId: "624526f956bd8600048c99ca",
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
    };
    let onError = (e) => console.error(e);

    // Load a model
    viewer.loadModel(modelConfigs, onPorgress, onLoaded, onError);
  }, []);

  return (
    <React.Fragment>
      <Box position="relative"  style={{ width: window.innerWidth, height: window.innerHeight }}>
        <Box id="viewer-overlay" className={classes.viewerOverlay}>
          <Typography variant="h6" gutterBottom component="div">
            h6. Heading
          </Typography>
        </Box>
        <Box id="viewer" className={classes.viewerContainer}></Box>

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
    backgroundColor: 'rgba(40, 215, 107, 0.46)',
  },
  viewerContainer: {
    textAlign: 'center',
    width: '100%',
    height: '100%',
  }
}));

export default App;
