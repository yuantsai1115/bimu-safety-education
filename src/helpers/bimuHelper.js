import * as bimU from "bimu.io.viewer";
import { isTwoPointsTooClose } from "./../ViewerHelper";

import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";

const IMG_WIDTH = "80%";

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
  setTimeout(() => {
    viewer.resetVisibility();
  }, 1000);
};

export const addTags = (
  viewer,
  regulations,
  eIdxByRegulation,
  imgFolder,
  images
) => {
  let tags = [];
  viewer.resetVisibility();
  Object.keys(eIdxByRegulation).map((key) => {
    let elementIndexArray = eIdxByRegulation[key];
    let regulation = regulations[key];
    let image = images[key];
    let bbox = viewer.getBoundingBox(elementIndexArray);
    let centroid = new window.THREE.Vector3();
    bbox.getCenter(centroid);
    let location = new window.THREE.Vector3(
      bbox.max.x,
      bbox.max.y,
      bbox.max.z + 0.25
    );
    tags.map((t) => {
      if (isTwoPointsTooClose(t.location, location, 0.5)) {
        location.z += 0.4;
      }
    });
    let imgTag =
      !!imgFolder && !!image && image != "0"
        ? `<img src="/images/${imgFolder}/${image}" style="width:${IMG_WIDTH};" >`
        : "";
    let uuid = viewer.addTag(key, location, { fontSize: 50 }, () => {
      viewer.showDialog(
        "",
        `<p>${regulation}</p>` + imgTag,
        "關閉",
        null,
        null,
        true
      );
    });
    tags.push({
      uuid: uuid,
      location: location,
      number: key,
      regulation: regulation,
      elementIndexArray: elementIndexArray,
    });
  });

  return tags;
};

export const addRegulationButtons = (
  classes,
  viewer,
  regulations,
  imgFolder,
  images,
  tags
) => {
  Object.keys(regulations).map((key) => {
    console.log(key);
    let k = key.split(" ")[0];
    viewer.addCustomButton(
      `regulation_${k}`,
      `collection-item-${k > 9 ? "9-plus" : k}`,
      "#e91e63",
      k,
      () => {
        let contents = [];
        regulations[k].split("。").map((r, i) => {
          if (r.length == 0) return;
          contents.push(
            <Typography
              key={`regulation_${k}_${i}`}
              variant="body1"
              className={classes.headerContent}
              component="p"
            >
              {i == 0 ? `[${k}]` : undefined}
              {r + "。"}
            </Typography>
          );
        });
        if (!!imgFolder && images[k] != "0") {
          contents.push(
            <Typography
              key={`${imgFolder}_${images[k]}`}
              variant="body1"
              className={classes.headerContent}
              component="div"
            >
              <img
                src={`/images/${imgFolder}/${images[k]}`}
                style={{ width: IMG_WIDTH }}
              ></img>
            </Typography>
          );
        }

        highlightElements(viewer, k, regulations[k], tags);
        return contents;
      }
    );
  });
};