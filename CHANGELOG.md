# Globe Changelog

## 1.5.8 [2025-10-22]

- Updated styling assets to support cesium update

## 1.5.7 [2025-10-22]

- Updated cesium to resolve additional @zip.js issues

## 1.5.6 [2025-10-22]

- Updated Globe to pin @zip.js dependency to a version that doesn't include a breaking change (2.7.x to 2.8.x moves where some files can be found, breaking cesium)

## 1.5.5 [2025-10-22]

- Updated Globe to only display selectable layers when there is more than 1 layer available
- Updated Globe to zoom in on rendered trajectories

## 1.5.4 [2025-10-21]

- fixed npm install

## 1.5.3 [2025-10-21]

- bumped config provider version

## 1.5.2 [2025-10-21]

- removed geoservices pipeline inclusion

## 1.5.1 [2025-10-21]

- removed package lock

## 1.5.0 [2025-10-21]

- updating to use nexus dependency publishing

## 1.4.7 [2025-10-21]

- updated package.json files to accomodate missing dependency on alt environments

## 1.4.6 [2025-10-21]

- updated package.json files to accomodate missing dependency on alt environments

## 1.4.5 [2025-10-21]

- updated pipelines to remove package-locks (avoids issues with dependencies in different envs)

## 1.4.4 [2025-10-20]

- updated pipeline to use rdc templates

## 1.4.3 [2025-10-17]

- updating pipeline definition3

## 1.4.2 [2025-10-16]

- Updated to autoinject Globe styling into projects that import the Globe component

## 1.4.1 [2025-10-15]

- Updated to latest web component baseline config

## 1.4.0 [2025-10-15]

- Updated package to also install cesium static resources into /public/cesium-assets

## 1.3.0 [2025-10-14]

- Updated Globe component to better import into strangely styled parents

## 1.2.0 [2025-10-13]

- Removed Resium

## 1.1.1 [2025-10-13]

- Updated Globe component to isolate internal styling
- Removed Cesium Ion dependencies within Components

## 1.1.0 [2025-10-13]

- Specified React version (setting to 18)

## 1.0.0 [2025-10-08]

- Initial Commit