var path = require("path");
var Session = require(path.join(__dirname, "..", "models", "session.js"));
var sessionControl = function(){
    var adminOnly = [
        {method:"post",path:"/listing/approve"},
        {method:"post",path:"/activateUser"},
        {method:"post",path:"/user/delete"},
        {method:"get",path:"/getAllFeedback"},
        {method:"post",path:"/markFeedback"},
        {method:"get",path:"/unlockip"},
        {method:"put",path:"/owner-request/[a-f\\d]{24}$"}
    ];
    var privatePath = [
        {method:"post",path:"/user/update"},
        {method:"post",path:"/upload-with-photo"},
        {method:"get",path:"/user/[a-f\\d]{24}$"},
        {method:"post",path:"/account-lock"},
        {method:"post",path:"/account/activation"},
        {method:"post",path:"/save-new-password"},
        {method:"get",path:"/owner-request/user/[a-f\\d]{24}$/listing/[a-f\\d]{24}$"},
        {method:"post",path:"/updateReview"},
        {method:"post",path:"/review/[a-f\\d]{24}$/[a-f\\d]{24}$/.+/.+/([0-9]+-[0-9]+-[0-9]{4})"},
        {method:"get",path:"/updateRatingAverage/[a-f\\d]{24}$"},
        {method:"get",path:"/my_reviews/:userId"},
        {method:"get",path:"/user_review_daycare/[a-f\\d]{24}$/[a-f\\d]{24}$"},
        {method:"get",path:"/my_reviewsOwned/[a-f\\d]{24}$"},
        {method:"get",path:"/my_daycares/[a-f\\d]{24}$"},
        {method:"post",path:"/saveSearch"},
        {method:"delete",path:"/saveSearch/[a-f\\d]{24}$"},
        {method:"put",path:"/saveSearch"},
        {method:"get",path:"/saveSearch/[a-f\\d]{24}$/.+"},
        {method:"get",path:"/saveSearch/[a-f\\d]{24}$"},
        {method:"post",path:"/saveSearch/[a-f\\d]{24}$"},
        {method:"post",path:"/favorites"},
        {method:"get",path:"/favorites/[a-f\\d]{24}$"},
        {method:"post",path:"/favorites/remove"},
        {method:"get",path:"/clients/[a-f\\d]{24}$"},
        {method:"post",path:"/clients/[a-f\\d]{24}$"},
        {method:"put",path:"/staff"},
        {method:"get",path:"/staff/[a-f\\d]{24}$/[a-f\\d]{24}$"},
        {method:"post",path:"/staff/removeStaff"},
        {method:"post",path:"/staff/updateStaff"},
        {method:"post",path:"/appointment"},
        {method:"post",path:"/article"},
        {method:"get",path:"/article/[a-f\\d]{24}$"},
        {method:"post",path:"/article/delete"},
        {method:"post",path:"/messageupdate"},
    ];

    var publicPath = [
        {method:"post",path:"/login"},
        {method:"post",path:"/user/register"},
        {method:"post",path:"/sessionsave"},
        {method:"post",path:"/sessiondelete"},
        {method:"post",path:"/search"},
        {method:"post",path:"/sendFeedback"},
        {method:"post",path:"/sendInvite"},
        //{method:"get",path:"/listing"},
        //{method:"get",path:"/questions"},
        //{method:"get",path:"/all_parents"},
        //{method:"get",path:"/all_providers"},

    ]
    sessionControl.prototype.isEndpointOpen = function(method,path){
        return(!isAdminOnly(method,path));
    }


    var isAdminOnly = function (method,path){
        //console.log("ENDPOINT: "+ method.toLowerCase() + " && "+ path.toLowerCase());

        for (var i = 0; i < adminOnly.length; i++) {
            var direct = adminOnly[i].path;
            var api = "/api"+ adminOnly[i].path;
            var rex = new RegExp("^"+direct,'i');
            var rexApi = new RegExp("^/api"+direct,'i');
            var reqPath = path;
            //console.log((api==reqPath)+ " : " +api + " == "+ reqPath);
            //console.log((api.toLowerCase()==reqPath)+ " : " +api.toLowerCase() + " == "+ reqPath);
            //console.log((rex.test(reqPath))+ " : " +rex + " regex "+ reqPath);
            //console.log((rexApi.test(reqPath))+ " : " +rexApi + " regex "+ reqPath);

            var isPathAdminOnly = (api==reqPath || direct==reqPath || api.toLowerCase()==reqPath || rex.test(reqPath)|| rexApi.test(reqPath) );
            if (adminOnly[i].method == method.toLowerCase() &&  isPathAdminOnly) {
                return true;
            }
        }
        return false;
    };

    var isPathPrivate = function (method,path){
        //console.log("ENDPOINT: "+ method.toLowerCase() + " && "+ path.toLowerCase());
        for (var i = 0; i < privatePath.length; i++) {
            var direct = privatePath[i].path;
            var api = "/api"+ privatePath[i].path;
            var rex = new RegExp("^"+direct,'i');
            var rexApi = new RegExp("^/api"+direct,'i');
            var reqPath = path;

            var isPrivatePath = (api==reqPath || direct==reqPath || api.toLowerCase()==reqPath || rex.test(reqPath)|| rexApi.test(reqPath) );
            if (privatePath[i].method == method.toLowerCase() &&  isPrivatePath) {
                return true;
            }
        }
        return false;

    };

    var isPathPublic = function (method,path){
        console.log("isPathPub ENDPOINT: "+ method.toLowerCase() + " && "+ path.toLowerCase());
        if(!isAdminOnly(method,path)&&!isPathPrivate(method,path)){
            console.log("PATH PUBLIC");
            return true;
        }
        for (var i = 0; i < publicPath.length; i++) {
            var direct = publicPath[i].path;
            var api = "/api"+ publicPath[i].path;
            var rex = new RegExp("^"+direct,'i');
            var rexApi = new RegExp("^/api"+direct,'i');
            var reqPath = path;

            var isPublicPath = (api==reqPath || direct==reqPath || api.toLowerCase()==reqPath || rex.test(reqPath)|| rexApi.test(reqPath) );
            if (publicPath[i].method == method.toLowerCase() &&  isPublicPath) {
                return true;
            }
        }
        return false;

    };

    var isSessionAdmin = function (sessionId,cb){
        Session.find({sessionId:sessionId,userType:'admin'},function(err,res){
            //console.log("isSessionAdmin");
            //console.log(res.length>0);
            if(res){
                cb(res.length>0);
            }else{
                cb(undefined);
            }
            
            
        });

    };

    var getSessionType = function (sessionId,cb){
        Session.findOne({sessionId:sessionId},function(err,res){
            if(res){
                cb(res.userType);
            }else{
                cb(null);
            }
        });
    }

    sessionControl.prototype.isAdminOnly=isAdminOnly;
    sessionControl.prototype.isPathPrivate=isPathPrivate;
    sessionControl.prototype.isPathPublic=isPathPublic;
    sessionControl.prototype.isSessionAdmin=isSessionAdmin;
    sessionControl.prototype.getSessionType=getSessionType;

};


module.exports = new sessionControl();
