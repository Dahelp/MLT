import assert from 'node:assert/strict';
import test from 'node:test';
import {scoutCrop} from '../content/scout-crop.ts';

test('scout crops remain 3:4 and inside portrait, landscape and square images at all positions and zoom levels',()=>{
 for(const [width,height] of [[900,1200],[1600,900],[800,800],[300,1600]])for(const zoom of [1,1.5,3])for(const x of [-1,0,.5,1,2])for(const y of [-1,0,.5,1,2]){
  const rect=scoutCrop(width,height,zoom,x,y);
  assert.ok(Math.abs(rect.width*4-rect.height*3)<1e-8);
  assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width+1e-8&&rect.y+rect.height<=height+1e-8);
 }
 assert.deepEqual(scoutCrop(900,1200),{x:0,y:0,width:900,height:1200});
 const left=scoutCrop(1600,900,1,0,.5),right=scoutCrop(1600,900,1,1,.5);
 assert.equal(left.x,0);assert.equal(right.x+right.width,1600);
});
