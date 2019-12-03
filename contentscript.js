"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
function htmlCollectionToArray(collection) {
    return Array.prototype.slice.call(collection, 0);
}
function stringToNumber(str) {
    return typeof str === 'string' ? parseInt(str, 10) : NaN;
}
function getElementBySelector(selector, elt) {
    var node = elt || document;
    var result = htmlCollectionToArray(node.querySelectorAll(selector))[0];
    return result;
}
function findDataAttribute(attr, elt) {
    var result = getElementBySelector("[" + attr + "]", elt);
    return result && result.getAttribute(attr) || null;
}
function identifyYourMrs(id, userId) {
    if (window.gon.current_user_id !== userId) {
        return;
    }
    // TODO see if it cannot be done in one selector
    var issuableUpvote = getElementBySelector("#merge_request_" + id + " .issuable-upvotes");
    var titleText = getElementBySelector("#merge_request_" + id + " .merge-request-title-text a");
    ;
    if (!issuableUpvote || !titleText) {
        return;
    }
    titleText.style.color = 'green';
}
function identifyMr(id, status) {
    var el;
    switch (status) {
        case 'approved':
            el = getElementBySelector("#merge_request_" + id + " .issuable-upvotes");
            break;
        case 'commented':
            el = getElementBySelector("#merge_request_" + id + " .issuable-comments a");
            break;
    }
    if (!el) {
        return;
    }
    el.style.color = 'red';
}
function setLocalCacheValue(key, value) {
    var cache = {};
    cache[key] = value;
    chrome.storage.local.set(cache);
}
function httpGet(url) {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("" + window.gon.gitlab_url.replace('http://', 'https://') + url, {
                        method: 'GET',
                        credentials: 'include'
                    })];
                case 1:
                    res = _a.sent();
                    if (!res.ok) {
                        throw new Error("Request url " + url + " : got " + res.status);
                    }
                    return [2 /*return*/, res];
            }
        });
    });
}
function getJson(url) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, httpGet(url)];
                case 1: return [2 /*return*/, (_a.sent()).json()];
            }
        });
    });
}
function isHighlightable(mr) {
    return !!mr.projectId;
}
function userMrsUrlFactory(params) {
    return function (pageIndex) { return params
        ? "/api/v4/" + params.type + "/" + params.id + "/merge_requests?state=opened&view=simple&per_page=500&page=" + pageIndex
        : "/api/v4/merge_requests?state=opened&view=simple&per_page=500&scope=all&page=" + pageIndex; };
}
function userValidatedMrsUrlFactory(params) {
    return function (pageIndex) { return params
        ? "/api/v4/" + params.type + "/" + params.id + "/merge_requests?my_reaction_emoji=thumbsup&state=opened&view=simple&per_page=500&page=" + pageIndex
        : "/api/v4/merge_requests?my_reaction_emoji=thumbsup&state=opened&view=simple&per_page=500&scope=all&page=" + pageIndex; };
}
function parseMrsList() {
    var lists = htmlCollectionToArray(document.getElementsByClassName('mr-list'));
    var mrs = [];
    for (var _i = 0, lists_1 = lists; _i < lists_1.length; _i++) {
        var mr = lists_1[_i];
        var children = htmlCollectionToArray(mr.children);
        for (var _a = 0, children_1 = children; _a < children_1.length; _a++) {
            var child = children_1[_a];
            var issuableReference = getElementBySelector('.issuable-reference', child);
            var issuableAuthored = getElementBySelector('.issuable-authored', child);
            mrs.push({
                id: stringToNumber(child.getAttribute('data-id')),
                iid: (issuableReference && stringToNumber(issuableReference.innerText.split('!')[1])) || NaN,
                authorId: (issuableAuthored && stringToNumber(findDataAttribute('data-user-id', issuableAuthored))) || NaN,
            });
        }
    }
    return mrs;
}
function fetchMrs(getUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var mrs, nbResult, i, res, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mrs = [];
                    nbResult = 100;
                    i = 1;
                    _a.label = 1;
                case 1:
                    if (!(nbResult >= 100)) return [3 /*break*/, 6];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, getJson(getUrl(i))];
                case 3:
                    res = _a.sent();
                    nbResult = res.length;
                    mrs.push.apply(mrs, res);
                    i++;
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    console.error(e_1);
                    return [3 /*break*/, 6];
                case 5: return [3 /*break*/, 1];
                case 6: return [2 /*return*/, mrs];
            }
        });
    });
}
function fetchUserMrsDetail() {
    return __awaiter(this, void 0, void 0, function () {
        var projectId, groupId, params;
        return __generator(this, function (_a) {
            projectId = findDataAttribute('data-project-id');
            groupId = findDataAttribute('data-group-id');
            params = projectId
                ? { type: 'projects', id: projectId }
                : groupId
                    ? { type: 'groups', id: groupId }
                    : undefined;
            return [2 /*return*/, Promise.all([
                    fetchMrs(userMrsUrlFactory(params)),
                    fetchMrs(userValidatedMrsUrlFactory(params)),
                ])];
        });
    });
}
function highlightMr(_a) {
    var iid = _a.iid, id = _a.id, authorId = _a.authorId, validated = _a.validated, projectId = _a.projectId;
    return __awaiter(this, void 0, void 0, function () {
        var username, approvedCacheKey, commentedCacheKey, baseProjectUrl;
        var _this = this;
        return __generator(this, function (_b) {
            username = window.gon.current_username;
            approvedCacheKey = username + "_approved_" + iid;
            commentedCacheKey = username + "_commented_" + iid;
            baseProjectUrl = "/api/v4/projects/" + projectId + "/merge_requests";
            chrome.storage.local.get([approvedCacheKey, commentedCacheKey], function () { return __awaiter(_this, void 0, void 0, function () {
                var mrNotes, userHasCommented;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            identifyYourMrs(id, authorId);
                            if (validated) {
                                identifyMr(id, 'approved');
                                setLocalCacheValue(approvedCacheKey, true);
                            }
                            return [4 /*yield*/, getJson(baseProjectUrl + "/" + iid + "/notes")];
                        case 1:
                            mrNotes = (_a.sent())
                                .filter(function (note) { return !!note.resolvable && !note.resolved; });
                            userHasCommented = !!mrNotes
                                .find(function (note) { return note.author.username === username; });
                            if (userHasCommented) {
                                identifyMr(id, 'commented');
                                setLocalCacheValue(commentedCacheKey, true);
                            }
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
function highlightMrs() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, userMrs, userValidatedMrs, mrsList, highlightableMrs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, Promise.all([fetchUserMrsDetail(), parseMrsList()])];
                case 1:
                    _a = _c.sent(), _b = _a[0], userMrs = _b[0], userValidatedMrs = _b[1], mrsList = _a[1];
                    highlightableMrs = mrsList
                        .map(function (mr) {
                        var userMr = userMrs.find(function (re) { return re.id === mr.id; });
                        var userValidatedMr = userValidatedMrs.find(function (re) { return re.id === mr.id; });
                        return __assign(__assign({}, mr), { projectId: (userMr && userMr.project_id.toString()) || undefined, validated: !!userValidatedMr });
                    })
                        .filter(isHighlightable);
                    highlightableMrs.forEach(highlightMr);
                    return [2 /*return*/];
            }
        });
    });
}
function boot() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (typeof window.gon !== 'object') {
                return [2 /*return*/];
            }
            if (window.gon.api_version !== 'v4') {
                return [2 /*return*/, console.error('Invalid gitlab api version.')];
            }
            if (!window.gon.current_username) {
                return [2 /*return*/, console.error('No found username.')];
            }
            highlightMrs();
            return [2 /*return*/];
        });
    });
}
window.addEventListener("message", function (event) {
    if (event.source !== window || !event.data.type || 'GON_VAR' !== event.data.type)
        return;
    window.gon = event.data.gon;
    boot();
}, false);
function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}
injectScript(chrome.extension.getURL('windowvar.js'), 'body');
