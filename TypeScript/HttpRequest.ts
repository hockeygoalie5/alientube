/**
    * Namespace for All RoYT operations.
    * @namespace RoYT
*/
module RoYT {
    /**
        * HttpRequest interface across Browsers.
        * @class HttpRequest
        * @param url URL to make the request to.
        * @param type Type of request to make (GET or POST)
        * @param callback Callback handler for the event when loaded.
        * @param [postdata] Key-Value object containing POST data.
    */
    "use strict";
    export class HttpRequest {
        private static acceptableResponseTypes = [200, 201, 202, 301, 302, 303, 0];

        constructor(url: string, type: RequestType, callback: any, postData?: any, errorHandler?: any) {
            let xhr = new XMLHttpRequest();
            xhr.open(RequestType[type], url, true);
            xhr.withCredentials = true;
            if (type === RequestType.POST) {
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            }

            xhr.onerror = function (e) {
                if (errorHandler) errorHandler(xhr.status);
            }.bind(this);
            
            xhr.onload = function () {
                if (HttpRequest.acceptableResponseTypes.indexOf(xhr.status) !== -1) {
                    /* This is an acceptable response, we can now call the callback and end successfuly. */
                    if (callback) {
                        callback(xhr.responseText);
                    }
                } else {
                    /* There was an error */
                    if (errorHandler) errorHandler(xhr.status);
                }
            }.bind(this);
                
            /* Convert the post data array to a query string. */
            if (type === RequestType.POST) {
                let query = [];
                for (let key in postData) {
                    query.push(encodeURIComponent(key) + '=' + encodeURIComponent(postData[key]));
                }
                xhr.send(query.join('&'));
            } else {
                xhr.send();
            }
        }



        /**
        * Generate a UUID 4 sequence.
        * @returns A UUID 4 sequence as string.
        * @private
        */
        private static generateUUID(): string {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                let r = Math.random() * 16 | 0,
                    v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }


    export enum RequestType {
        GET,
        POST
    }
}
