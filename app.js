import fs from "fs";
import { App } from "octokit";

const app = new App({
  appId: 354998,
  privateKey: process.env.APP_PRIVATE_KEY,
});

for await (const { octokit, repository } of app.eachRepository.iterator()) {
  console.log("start process repo %s", repository.full_name);
  if("public" == repository.visibility){
    const data = await octokit.graphql(
`{
  repository(owner: "${repository.owner.login}", name: "${repository.name}") {
    releases(first: 100) {
      totalCount
      nodes {
        name
        tagName
        description
        releaseAssets(first: 100) {
          totalCount
          nodes {
            downloadCount
          }
        }
      }
    }
  }
}`
);
    const result = []
    for(const release of data.repository.releases.nodes){
      let downloadCount = 0
      for(const asset of release.releaseAssets.nodes){
        downloadCount += asset.downloadCount
      }
      result.push({
            "id": release.tagName,
            "name": release.name,
            "description": release.description,
            "downloadCount": downloadCount,
            "repo": {
                "owner": repository.owner.login,
                "name": repository.name
            }
        })
    }
    fs.writeFile("result/result.json",JSON.stringify(result),()=>console.log("result write success"));
  }else{
    console.warn("repo %s not is public",repository.full_name);
  }
}