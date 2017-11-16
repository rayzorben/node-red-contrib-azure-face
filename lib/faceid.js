
module.exports = function(RED) {
    'use strict';
    var request = require('request');

    function faceid(config) {

        RED.nodes.createNode(this,config);
        var node = this;
        
        this.on('input', function(msg) {

            if (this.credentials == null || this.credentials.key == null || this.credentials.key == "") {
                node.error("Input subscription key", msg);
                node.status({fill: "red", shape: "ring", text: "Error"});
                console.log("Input subscription key");
                return;
            }

            var options = {
                url: 'https://' + config.region + '.api.cognitive.microsoft.com/face/v1.0/identify',
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.credentials.key,
                    'Content-Type': 'application/json'
                },
                json: msg.payload
            };

            node.status({fill: "blue", shape: "dot", text: "Requesting"});

            node.debug("options=" + JSON.stringify(options));

            request.post(options, function (error, response, body) {
                try {

                    if(error) {
                        node.error(error.message, msg);
                        node.status({fill: "red", shape: "ring", text: "Error"});
                        return;
                    }
                    
                    try { body = JSON.parse(body); } catch (e) {}
                    node.debug("response.statusCode=" + response.statusCode + ", body=" + JSON.stringify(body));

                    if(response.statusCode != 200 || body == null) {
                        node.error(body + ' [code='+response.statusCode + ']', msg);
                        node.status({fill: "red", shape: "ring", text: "Error"});
                        return;
                    }            

                    msg.payload = null;
                    if(body.length > 0 && body[0].candidates.length > 0) {
                        msg.payload = body[0].candidates[0].personId;
                    }
                    msg._faceid = body;
                    node.send(msg);
                    node.status({});

                } catch (e) {
                    node.error(e.message, msg);
                    node.status({fill: "red", shape: "ring", text: "Error"});
                }
            });

        });
    }

    RED.nodes.registerType("faceid", faceid,
    {
        credentials: {
            key: {
                type: "password"
            }
        }
    });                       
}