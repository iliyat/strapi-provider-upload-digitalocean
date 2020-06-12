"use strict";

/**
 * Module dependencies
 */

/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
// Public node modules.
const AWS = require("aws-sdk");

module.exports = {
  provider: "digitalocean",
  name: "Digitalocean Spaces service",
  defaultConfig: {
    key: '',
    secret: '',
    region: 'fra1',
    space: '',
    cdn: false,
    cdnDomain: ''
  },
  init: providerOptions => {
    const config = Object.assign({}, this.defaultConfig, providerOptions)
    const S3 = new AWS.S3({
      accessKeyId: config.key,
      secretAccessKey: config.secret,
      sslEnabled: true,
      endpoint: `${config.region}.digitaloceanspaces.com`,
      params: {
        Bucket: config.space
      }
    });

    return {
      upload: file => {
        return new Promise((resolve, reject) => {
          const path = file.path ? `${file.path}/` : "";
          S3.upload(
            {
              Key: `${path}${file.hash}${file.ext}`,
              Body: new Buffer(file.buffer, "binary"),
              ACL: "public-read",
              ContentType: file.mime
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              if (config.cdn) {
                if (config.cdnDomain) {
                  data.Location = `https://${config.cdnDomain}/${data.key}`
                } else {
                  data.Location = data.Location.replace(`.digitaloceanspaces.com`, `.cdn.digitaloceanspaces.com`);
                }
              }
              file.url = data.Location;
              resolve();
            }
          );
        });
      },
      delete: file => {
        return new Promise((resolve, reject) => {
          const path = file.path ? `${file.path}/` : "";
          S3.deleteObject(
            {
              Key: `${path}${file.hash}${file.ext}`
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
        });
      }
    };
  }
};
