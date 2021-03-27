/*
 * This function loads product data and returns it for use in the UI.
 */

const https = require('https')

const rentalName = process.env.RENTAL_NAME;

exports.handler = async () => {
  console.log(rentalName);

  var post_data = JSON.stringify({
    rental: rentalName
  });

  var options = {
    url: 'https://oldsheepranchinn.api.stdlib.com/get-rooms@dev',
    port: '443',
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  };

  var roomsArr = "";

  var request = https.request(options, (response)=>{
    let chunks_of_data = [];
  
    response.on('data', (fragments) => {
      chunks_of_data.push(fragments);
    });
  
    response.on('end', () => {
      let response_body = Buffer.concat(chunks_of_data);
      roomsArr = response_body.toString();
    });
  
    response.on('error', (error) => {
      console.log(error);
    });
  });

  request.on('error', (error) => {
    console.log('Error Code: ' + error.code);
    console.log('Error Message: ' + error.message);
  });
  
  request.write(post_data);
  request.end();

  console.log(roomsArr);

  var body = roomsArr;
  return {
    statusCode: 200,
    body: body
  };
};
