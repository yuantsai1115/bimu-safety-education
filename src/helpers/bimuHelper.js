import * as bimU from 'bimu.io.viewer';
import { isTwoPointsTooClose } from './../ViewerHelper';


export const highlightElements = (viewer, number, regulation, tags) => {
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
