import select from '@inquirer/select';
import chalk from 'chalk';
import boxen from 'boxen';
function getCurrentWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return Math.ceil((dayOfYear + start.getDay() + 1) / 7);
}
const week = getCurrentWeekNumber();
const findLatestReleaseTag = `
The easiest way to find the latest release tag for PWA (only) is to look at the last line of the file:
https://github.com/MediaMarktSaturn/webmobile-deployment-manifest/blob/prod/apps/common/prod/pwa-release.yaml

alternatively for PWA and the only way for BOS is to:

1. https://console.cloud.google.com/kubernetes/workload

2. At the table click on the BOS or PWA link

3. At the table named "Active Revisions", at the "Summary" Column, select the short_sha value after the "/bos:" or "/pwa:" part. This is the latest BOS / PWA commit that was deployed to production

4. Do git tag --points-at <commithash> to find the tag that was deployed to production (BOS or PWA repo)
`;
console.clear();
async function main() {
    let backToMainMenu = false;
    do {
        const project = await select({
            message: chalk.cyan('Select a project'),
            choices: [
                {
                    name: 'BOS',
                    value: 'BOS',
                },
                {
                    name: 'PWA',
                    value: 'PWA',
                },
                {
                    name: 'FAQs',
                    value: 'FAQs',
                },
            ],
        });
        let choices = [];
        if (project === 'BOS') {
            choices = [
                {
                    name: 'Create a BOS release',
                    value: 'releaseBOS',
                },
                {
                    name: 'Deploy BOS to production',
                    value: 'deployBOS',
                },
                {
                    name: 'Do a BOS hotfix',
                    value: 'hotfixBOS',
                },
                {
                    name: 'Rollback BOS',
                    value: 'rollbackBOSorPWA',
                },
                {
                    name: 'Rollback BOS using Manifest',
                    value: 'rollbackBOSUsingManifest',
                },
                {
                    name: 'Restart BOS in Production',
                    value: 'RestartBOSinProd',
                },
                {
                    name: 'Back to main menu',
                    value: 'backToMainMenu',
                },
            ];
        }
        else if (project === 'PWA') {
            choices = [
                {
                    name: 'Create a PWA release',
                    value: 'releasePWA',
                },
                {
                    name: 'Deploy PWA to production',
                    value: 'deployPWA',
                },
                {
                    name: 'Do a PWA hotfix',
                    value: 'hotfixPWA',
                },
                {
                    name: 'Rollback PWA',
                    value: 'rollbackBOSorPWA',
                },
                {
                    name: 'Rollback PWA using Manifest',
                    value: 'rollbackPWAUsingManifest',
                },
                {
                    name: 'Restart PWA in Production',
                    value: 'RestartPWAinProd',
                },
                {
                    name: 'Back to main menu',
                    value: 'backToMainMenu',
                },
            ];
        }
        else if (project === 'FAQs') {
            choices = [
                {
                    name: 'Find latest release tag',
                    value: 'findLatestReleaseTag',
                },
                {
                    name: 'Has my commit been deployed to production?',
                    value: 'hasMyCommitBeenDeployedToProduction',
                },
                {
                    name: 'Back to main menu',
                    value: 'backToMainMenu',
                },
            ];
        }
        const answerValue = await select({
            message: chalk.cyan('Select what you want to do'),
            choices: choices
        });
        if (answerValue === 'backToMainMenu') {
            backToMainMenu = true;
        }
        else {
            backToMainMenu = false;
            switch (answerValue) {
                case 'releaseBOS':
                    console.log(boxen(chalk.green(`
        DO:
        1. git checkout develop
        2. git pull
        3. git checkout -b release-bos-week${week}
        4. git push origin release-bos-week${week}
        5. wait for the release workflow to complete release-bos.yml
        6. look at what the cd-bos.yaml action is doing
        7. check the e2e tests at https://github.com/MediaMarktSaturn/webmobile-pwa/actions/workflows/playwright-workflow-dispatch.yml

        Note: The info is at: 
        https://github.com/MediaMarktSaturn/webmobile-bos?tab=readme-ov-file#how-do-we-create-a-release
        `), { padding: 1 }));
                    break;
                case 'releasePWA':
                    console.log(boxen(chalk.green(`
      DO:
      1. ./scripts/check_unmerged_tags.sh 
      2. git checkout develop
      3. git pull
      4. git checkout -b release-pwa-week${week}
      5. git push --set-upstream origin release-pwa-week${week}
      6. look at what the  cd-pwa.yml action is doing (It deploys to qa and prelive)  
      7. check the e2e tests at https://github.com/MediaMarktSaturn/webmobile-pwa/actions/workflows/playwright-workflow-dispatch.yml

      Note: The info is at: https://github.com/MediaMarktSaturn/webmobile-pwa/blob/develop/docs/DEVELOPMENT_FLOW.md#how-to-create-a-release
      `), { padding: 1 }));
                    break;
                case 'RestartPWAinProd': 
                    console.log(boxen(chalk.green(`
        Do the following steps:
        1. Checkout the prod branch of https://github.com/MediaMarktSaturn/webmobile-deployment-manifest
        2. Edit the file apps/common/prod/pwa-release.yaml by changing the value of the trigger field to a different value
        3. Commit the change and create a PR to merge the change to the prod branch
        4. Merge the PR to the prod branch
                        `), { padding: 1 }));
                    break;
                case 'deployBOS':
                    console.log(boxen(chalk.green(`
        DO:
        1. Look the https://rkt.mediamarktsaturn.com/channel/webshop-deployment channel if the last 15 minutes another deployment has been announced
           If yes, wait for the deployment to finish (you can contact the person who triggered the deployment to ask if it's safe to deploy)
        2. Notify about the deployment in the channel https://rkt.mediamarktsaturn.com/channel/webmobile-pwa and
            https://rkt.mediamarktsaturn.com/channel/webshop-deployment 
        3. Get the latest release tag from https://github.com/MediaMarktSaturn/webmobile-bos/tags
        4. use the deploy-bos.yml to trigger the production deployment with the release tag
        5. check the e2e tests at https://github.com/MediaMarktSaturn/webmobile-pwa/actions/workflows/playwright-workflow-dispatch.yml
        6. Look at the grafana dashboard to see if the deployment introduced some errors
           link: https://webshop-monitoring-prod.cloud.mmst.eu/d/Asdfadsfhyn/webshop-devops?orgId=1&refresh=1m&from=now-1h&to=now-1m
        7. If everything went well, notify at the 2 channels that the deployment was successful
        8. create in GITHUB the release PR back to develop, ask an admin to merge WITHOUT SQUASHING with merge commit

        Note: The info is at: 
        https://github.com/MediaMarktSaturn/webmobile-bos?tab=readme-ov-file#how-do-we-create-a-release
        `), { padding: 1 }));
                    break;
                case 'RestartBOSinProd': 
                    console.log(boxen(chalk.green(`
        Do the following steps:
        1. Checkout the prod branch of https://github.com/MediaMarktSaturn/webmobile-deployment-manifest
        2. Edit the file apps/common/prod/bos-release.yaml by changing the value of the trigger field to a different value
        3. Commit the change and create a PR to merge the change to the prod branch
        4. Merge the PR to the prod branch
                        `), { padding: 1 }));
                    break;
                case 'rollbackPWAUsingManifest': 
                    console.log(boxen(chalk.green(`
        Do the following steps:
        1. Navigate at https://console.cloud.google.com/kubernetes/deployment/europe-west4/cluster-europe-west4/prod/pwa/history?project=mms-web-webmobile-mreg-p-v002 
        2. Get from the summary column the short_sha value after the "/pwa:" part. This is the latest PWA commit that was deployed to production
        3. Checkout the prod branch of https://github.com/MediaMarktSaturn/webmobile-deployment-manifest
        4. Edit the file apps/common/prod/pwa-release.yaml by 
            a. changing the value of the image version to the previous one
            b. changing the value of the releaseTag to the previous one. You can find the value of the previous release tag by looking at the history of the pwa-release.yaml file
        5. Commit the change and create a PR to merge the change to the prod branch
        6. Merge the PR to the prod branch
                        `), { padding: 1 }));
                    break;
                case 'rollbackBOSUsingManifest': 
                    console.log(boxen(chalk.green(`
        Do the following steps:
        1. Navigate at https://console.cloud.google.com/kubernetes/deployment/europe-west4/cluster-europe-west4/prod/bos/history?project=mms-web-webmobile-mreg-p-v002 
        2. Get from the summary column the short_sha value after the "/bos:" part. This is the latest BOS commit that was deployed to production
        3. Checkout the prod branch of https://github.com/MediaMarktSaturn/webmobile-deployment-manifest
        4. Edit the file apps/common/prod/bos-release.yaml by 
            a. changing the value of the image version to the previous one
            b. changing the value of the releaseTag (if it exists) to the previous one. You can find the value of the previous release tag by looking at the history of the bos-release.yaml file
        5. Commit the change and create a PR to merge the change to the prod branch
        6. Merge the PR to the prod branch
                        `), { padding: 1 }));
                    break;
                    
                case 'deployPWA':
                    console.log(boxen(chalk.green(`
      DO:
      1. Open a PR from release-pwa-week${week} to develop
      2. Get the release tag from the automatically created release commit of the PR
          For example if the commit is "chore(release): webmobile-pwa-v8.69.0" the tag is "webmobile-pwa-v8.69.0"
      3. Look the https://rkt.mediamarktsaturn.com/channel/webshop-deployment channel if the last 15 minutes another deployment has been announced
         If yes, wait for the deployment to finish (you can contact the person who triggered the deployment to ask if it's safe to deploy)
      4. Notify about the deployment in the channel https://rkt.mediamarktsaturn.com/channel/webmobile-pwa and
         https://rkt.mediamarktsaturn.com/channel/webshop-deployment       
      5. Use the deploy-project.yml to trigger the production deployment with the previously copied release tag
      6. check the e2e tests at https://github.com/MediaMarktSaturn/webmobile-pwa/actions/workflows/playwright-workflow-dispatch.yml
      7. Look at the grafana dashboard to see if the deployment introduced some errors
      link: https://webshop-monitoring-prod.cloud.mmst.eu/d/Asdfadsfhyn/webshop-devops?orgId=1&refresh=1m&from=now-1h&to=now-1m
      8. If everything went well, notify at the 2 channels that the deployment was successful

      Note: The info is at: https://github.com/MediaMarktSaturn/webmobile-pwa/blob/develop/docs/DEVELOPMENT_FLOW.md#how-to-create-a-release
      `), { padding: 1 }));
                    break;
                case 'hotfixBOS':
                    console.log(boxen(chalk.green(`
      1. create a branch from the latest release tag deployed in prod, so if prod has the tag v1.257.1, 
         a) git checkout v1.257.1 && git checkout -b hotfix-bos-v1.257.1
      2. push the branch to remote git push origin hotfix-bos-v1.257.1
      3. wait for the release workflow to complete release-bos.yml
      4. follow the cd-bos.yaml
      5. check the e2e tests at https://github.com/MediaMarktSaturn/webmobile-pwa/actions/workflows/playwright-workflow-dispatch.yml
      6. Now do the deployment to production according to the deployBOS steps

      Note: The info is at: 
      https://github.com/MediaMarktSaturn/webmobile-bos?tab=readme-ov-file#how-do-we-create-a-release

      `), { padding: 1 }));
                    break;
                case 'hotfixPWA':
                    console.log(boxen(chalk.green(`
      1: check unmerged tags, read latest tag and create hotfix branch
        a) ./scripts/check_unmerged_tags.sh
        b) git fetch --tags
        c) git checkout develop
        d) git pull
        # ATTENTION!!!
        # we're assuming the latest tag is also the one in production
        # double check if this tag is the latest revision in the kubernetes prod or deployment manifest
        e) release_tag=$(git describe --tags --match "webmobile-pwa-v*" --abbrev=0)
        # it will be eg: webmobile-pwa-v-8.2.0
        f) git checkout $release_tag
        g) version=$(echo $release_tag | awk -F'-v' '{print $2}') # 8.2.0
        h) git checkout -b hotfix-pwa-v$version

      2. make changes or cherry-pick a commit and push
        a) git add .
        b) git commit -m "fix(webmobile-pwa): WFA-000 some hotfix changes"
        c) git push origin hotfix-pwa-v$version
        
      Info: The push to hotfix-* branch trigger the nx release, it pushes the tags and runs the cd-pwa.yml that deploys to qa and prelive

      3. Watch the actions
        a) on push to hotfix-* -> creates and pushes release tag release-pwa.yml
        b) on tag push -> deploy to qa and prelive cd-pwa.yml
      4. Create pull request to merge the tag to develop  
        a) gh pr create --base develop --head hotfix-pwa-v$version \
              --title "chore(hotfix): WFA-000 webmobile-pwa-v$version" \
              --body "This is a hotfix for webmobile-pwa-v$version"  
      5. Get the hotfix tag from the automatically created release commit of the PR to develop
          For example if the commit is "chore(hotfix): WFA-000 webmobile-pwa-v8.69.1" the tag is "webmobile-pwa-v8.69.1" // Make sure that this step is correct
      `), { padding: 1 }));
                    break;
                case 'rollbackBOSorPWA':
                    console.log(boxen(chalk.green(`
      1. Find the latest release tag using the findLatestReleaseTag option
      2. Use the deploy-project.yml or deploy-bos.yml workflow with the tag from the previous release to rollback the production deployment

      `), { padding: 1 }));
                    break;
                case 'findLatestReleaseTag':
                    console.log(boxen(chalk.green(`GO TO:
      ${findLatestReleaseTag}
      `), { padding: 1 }));
                    break;
                case 'hasMyCommitBeenDeployedToProduction':
                    console.log(boxen(chalk.green(`
      GO TO:
      ${findLatestReleaseTag}
      5. Do "git tag --contains <commithash>" // where the <commithash> here is not the one from the previous step but the commit you want to check
      `), { padding: 1 }));
                    break;
                default:
                    break;
            }
        }
    } while (backToMainMenu);
}
main();
