'use strict';

let demoFixtures;
window.courseDemoApi = createDemoApi(window.localStorage, () => {
  demoFixtures ||= fetch('/demo-fixtures.json')
    .then(response => {
      if (!response.ok) throw new Error('Could not load the example documents.');
      return response.json();
    })
    .catch(error => {
      demoFixtures = undefined;
      throw error;
    });
  return demoFixtures;
});
