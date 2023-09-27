/** @type {import('next').NextConfig} */
module.exports = {
    webpack: (config, { isServer }) => {
      console.log(config.resolve.fallback);  // Debug line
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          "stream": require.resolve("stream-browserify"),
        };
      }
      return config;
    },
  };
  