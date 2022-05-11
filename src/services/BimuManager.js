
import * as bimU from 'bimu.io.viewer';

export default class BimuManager {
    static initViewer = (viewerConfigs, selectedElementIndices) => {
        // Initialise a Viewer 
        let viewer = new bimU.Viewer(viewerConfigs);
        viewer.initialize();
        viewer.addEventListener(bimU.EventsEnum.ON_SELECTION_CHANGED, (e) => selectedElementIndices = e.selectedElementIndices);
        
        this.viewer = window.viewer = viewer;
        return viewer;
    }
}

