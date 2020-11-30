
module.exports = function(RED) {
    'use strict';
    var request = require('request');

    function faceid(config) {

        RED.nodes.createNode(this,config);
        var node = this;
        
        this.on('input', function(msg) {
            let endpoint;
            let key;
            let timeout;
            
            if (msg.facedetect != null) {
                if (msg.facedetect.endpoint != null) {
                    endpoint = msg.facedetect.endpoint;
                }
                
                if (msg.facedetect.key != null) {
                    key = msg.facedetect.key;
                }

                timeout = msg.facedetect.timeout
            }

            if (endpoint == null) {
                endpoint = config.endpoint;
            }

            if (key == null && this.credentials != null) {
                key = this.credentials.key;
            }

            if (key == null || key == "") {
                node.error("Input subscription key", msg);
                node.status({fill: "red", shape: "ring", text: "Error"});
                console.log("Input subscription key");
                return;
            }

            const options = {
                url: endpoint + 'face/v1.0/identify',
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/json'
                },
                json: msg.payload,
                timeout: timeout
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
                        node.error(JSON.stringify(body) + ' [code='+response.statusCode + ']', msg);
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