module.exports = function(RED) {
    'use strict';
    var request = require('request');
    
    function facedetect(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        
        this.on('input', function(msg) {

            if (this.credentials == null || this.credentials.key == null || this.credentials.key == "") {
                node.error("Missing subscription key", msg);
                node.status({fill: "red", shape: "ring", text: "Error"});
                return;
            } 

            var options = null;
            if (Buffer.isBuffer(msg.payload)) {
                options = {
                    url: 'https://' + config.region + '.api.cognitive.microsoft.com/face/v1.0/detect',
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': this.credentials.key,
                        'Content-Type': 'application/octet-stream'
                    },
                    "body": msg.payload
                };
            } else if (typeof(msg.payload) == 'string' && (msg.payload.indexOf('http://') === 0 || msg.payload.indexOf('https://') === 0)) {
                options = {
                    url: 'https://' + config.region + '.api.cognitive.microsoft.com/face/v1.0/detect',
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': this.credentials.key,
                        'Content-Type': 'application/json'
                    },
                    json: {
                        "url": msg.payload
                    }
                };
            }

            if(options == null) {
                node.error("Unsupported format: This node supports Buffer data from file-in node and URL String data", msg);
                node.status({fill: "red", shape: "ring", text: "Error"});
                return;
            }

            node.status({fill: "blue", shape: "dot", text: "Requesting"});

            request.post(options, function (error, response, body) {
                try {

                    if(error) {
                        node.error(error.message, msg);
                        node.status({fill: "red", shape: "ring", text: "Error"});
                        return;
                    }

                    try { body = JSON.parse(body); } catch (e) {}

                    node.trace("response.statusCode=" + response.statusCode + ", body=" + JSON.stringify(body));
                    if(response.statusCode != 200 || body == null) {
                        node.error(JSON.stringify(body) + ' [code='+response.statusCode + ']', msg);
                        node.status({fill: "red", shape: "ring", text: "Error"});
                        return;
                    }

                    if (body.length > 0 && body[0].faceRectangle != null) {
                        msg.payload = body[0].faceId;
                    } else {
                        msg.payload = null;
                    }
                    msg._facedetect = body;
                    node.send(msg);
                    node.status({});

                } catch (e) {
                    node.error(e.message, msg);
                    node.status({fill: "red", shape: "ring", text: "Error"});
                }
            });
            
        });
    }

    RED.nodes.registerType("facedetect", facedetect,
    {
        credentials: {
            key: {
                type: "password"
            }
        }
    });                       
}