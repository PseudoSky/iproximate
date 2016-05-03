var _=require('lodash'),
    KD=require('./kd/kdTree'),
    locations=require('./locations.json');

var features=["a","b","c","d"];
var tree;
_.mixin({abs:Math.abs})

// Transform the location objects such that each contains k:v pairs
// For each of the 4 IPV4 blocks
locations=_.transform(locations,function(res,n){
  n = _(n.ip).split('.')
             .zipObject( ['a','b','c','d'] )
             .invert()
             .mapValues( _.parseInt )
             .merge(n)
             .value();

  res.push(n);
});

//  Calculate the spacial distance between two  
//  Geographic Points [lon,lat],[lon,lat],...
//
//  Passed to function:                           
//    a  = [lon,lat] point 1 (in decimal degrees) 
//    b  = [lon,lat] point 2 (in decimal degrees) 
//    unit = the unit you desire for results      
//           where: 'M' is statute miles (default)
//                  'K' is kilometers             
//                  'N' is nautical miles         
function geo_dist(a,b, unit) {
  var radlat1 = Math.PI * a[1]/180
  var radlat2 = Math.PI * b[1]/180
  var theta = a[0]-b[0]
  var radtheta = Math.PI * theta/180
  var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist)
  dist = dist * 180/Math.PI
  dist = dist * 60 * 1.1515
  if (unit=="K") { dist = dist * 1.609344 }
  if (unit=="N") { dist = dist * 0.8684 }
  return dist
}

// Alternate distance function
function distance(a, b) {
  var da = Math.pow(a.a-b.a,6);
  var db = Math.pow(a.b-b.b,4);
  var dc = Math.pow(a.c-b.c,2);
  var dd = a.d-b.d;
  return da*da + db*db + dc*dc + dd*dd;
}

// Convert IPV4 Blocks to single number
function block_to_num(o){
  return (o.a*1000000000) + (o.b*1000000) + (o.c*1000) + o.d
}

// Approximate the distance between two IP addresses
function ip_prox(a, b) {
  return _.abs(block_to_num(a)-block_to_num(b));
}

// Find k nearest IP addresses to a given IP
function findNearest(ip,k) {
  var ip_blocks = _( ip ).split('.')
                       .zipObject( ["a","b","c","d"] )
                       .invert()
                       .mapValues( _.parseInt )
                       .value();

  return tree.nearest(ip_blocks, k||5);
}

tree = new KD.kdTree(locations, ip_prox, features);

var nearest=findNearest("50.141.30.244",10);

console.log(
    _(nearest).orderBy('[1]') // Sortby error
              .map('[0]') // Grab the data
              .map(_.partialRight(_.pick,['ip','geo']))
              .tap(console.log)
              .map('geo.ll') // Lon, Lat spatial dist from target.
              .map(_.partial(geo_dist,[ 37.7312, -122.3826 ])).sum()
)
