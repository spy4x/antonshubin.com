# Personal website with portfolio and blog

## Setup

- Create a Firebase project in the [Firebase console](https://console.firebase.google.com/).
- Install dependencies: `yarn` 
- Login to Firebase: `yarn firebase login`
- Initialize Firebase: `firebase init`
- Select "Hosting: Configure and deploy Firebase Hosting sites" and press Enter.
- Select your Firebase project.
- Enter "dist" as your public directory.
- Configure as a single-page app: No.
- Install dependencies with Yarn: No.
- Deploy your app: `yarn deploy`
- Your app should now be live at `https://<PROJECT_ID>.firebaseapp.com`.

## Development

1. Run `yarn start` to start the development server.
2. Your app should now be live at `http://localhost:3000`.

## Deploying

Run `yarn deploy` to deploy it to Firebase. 

If you only want frontend part to be deployed (without Cloud Functions), run `yarn deploy --only hosting`. It will be much faster.

## Resources

- [Firebase CLI Reference](https://firebase.google.com/docs/cli/)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting/)

