# React + Next

Bithomp Frontend

## Available Scripts

In the project directory, you can run:

### `yarn dev`

`NEXT_PUBLIC_NETWORK_NAME=mainnet yarn dev`

mainnet | staging | testnet | devnet | beta | amm

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `yarn build`

Builds the app for production.

### `yarn start`

Runs the app in production

## Run the app localy

`cd <folder for projects>` // create a folder and open terminal/console there.

`npm install -g yarn` // install yarn if you do not have it yet

`git clone --single-branch https://github.com/Bithomp/frontend-react.git` // copy the repository

`cd frontend-react` // open the folder with the repo in the terminal/console

`mv .env .env.local` // rename .env into .env.local

`nano .env.local` // open the file .env.local and remove # for the env you have api key for and before the last line with the key, enter your API key

`yarn` // install packgaes

`yarn dev` // run project in dev mode, you will see on the localhost:3000 

### Deployment (first time)

`cd <folder for projects>`

`npm install -g yarn`

`git clone --single-branch https://github.com/Bithomp/frontend-react.git`

`cd frontend-react`

`mv .env .env.local`

`nano .env.local` //remove # for the correct env and save the changes

`yarn`

`yarn build`

`pm2 start yarn --name "frontend-react" -- start` // otherwise: -- start:next

`pm2 logs frontend-react --lines 1000` //verify it runs properly

`pm2 save`

### Update

`cd <folder for projects>/frontend-react`

`git pull`

`yarn` // if packages were updated

`yarn build`

`pm2 restart frontend-react`

### Clean up if run on small VPS

`yarn cache clean`
