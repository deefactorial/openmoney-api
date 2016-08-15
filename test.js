var namespace = {};
namespace.namespace = "grandchild.child.parent.grandparent";
var parents = namespace.namespace.split('.');
for(var i = 1; i < parents.length ;i++ ){
    for(var j = i+1; j < parents.length; j++){
        parents[i] +=  "." + parents[j];
    }
}
parents.shift();
console.log(JSON.stringify(parents));
//[0] = "child.parent.grandparent";
//[1] = "parent.grandparent";
//[2] = "grandparent";