export const isTwoPointsTooClose = (ptA, ptB, distance) => {
    let result = false;
    if (!ptA.x || !ptA.y || !ptA.z || !ptB.x || !ptB.y || !ptB.z) {
        return undefined;
    }
    if (Math.abs(ptA.x-ptB.x) <= distance
        && Math.abs(ptA.y-ptB.y) <= distance
        && Math.abs(ptA.z-ptB.z) <= distance) {
        result = true;
    }

    return result;
}