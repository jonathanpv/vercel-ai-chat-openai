/** @type {import('next').NextConfig} */
<<<<<<< HEAD
const nextConfig = {};

module.exports = nextConfig;
=======
module.exports = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**',
      },
    ],
  },
};
>>>>>>> 477b9034fa55aaaf7a6ec5ba263113454f556d4e
