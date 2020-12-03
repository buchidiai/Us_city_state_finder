const fetch = require("node-fetch");

const fs = require("fs");

let states = "";

const delay = (ms = 3000) => new Promise((r) => setTimeout(r, ms));

require("dotenv").config();

const writeFileToJson = (fileName, object) => {
  fs.writeFile(
    fileName,
    JSON.stringify(object, null, 2),
    "utf8",
    function (err, data) {
      // console.log(data)
      if (err) {
        console.log(err);
        return;
      } else {
        console.log("created ", fileName.substring(2, fileName.length));
      }
    }
  );
};

const getStates = async () => {
  console.log("Getting states");
  const res = await fetch(
    "https://api.countrystatecity.in/v1/countries/us/states",
    {
      method: "GET",
      headers: {
        "content-type": "application/json",
        "X-CSCAPI-KEY": process.env.API_KEY,
      },
    }
  );

  let statesRes = await res.json();

  return statesRes;
};

const getCityForStateFromApi = async function (items) {
  //loop through array for states
  for (let index = 0; index < items.length; index++) {
    //delay by 10 secs each request
    await delay();
    //make request
    const res = await fetch(
      "https://api.countrystatecity.in/v1/countries/us/states/" +
        items[index].iso +
        "/cities",
      {
        method: "GET",
        headers: {
          "content-type": "application/json",
          "X-CSCAPI-KEY": process.env.API_KEY,
        },
      }
    );
    //get response
    let cities = await res.json();
    //check if state has cities
    if (cities.length !== 0) {
      //change index id of cities
      for (let index = 0; index < cities.length; index++) {
        cities[index].id = index + 1;
      }
    }
    //set array to cities object
    items[index].cities = cities;
    items[index].lastUpdate = new Date();

    console.log("====================================");
    console.log("id", index);
    console.log("state", items[index].state);
    console.log("num_Cities", cities.length);
    console.log("====================================");
  }

  return items;
};

const getCities = async () => {
  const statesArr = Array.from(states, (item) => {
    return {
      state: item.name,
      iso: item.iso2,
    };
  });

  // Remove state duplications
  const filteredStates = [...new Set(statesArr)];
  //get results after making all api calls
  const results = await getCityForStateFromApi(filteredStates);

  writeFileToJson("./state_cities.json", results);
};

getStates()
  .then(async (res) => {
    if (res) {
      states = res;
      //this creates states.json file
      writeFileToJson("./states.json", res);
    } else {
      throw new Error("Error occured finding states");
    }
  })
  .then(() => {
    getCities();
  })
  .catch((err) => {
    console.log(err);
  });
