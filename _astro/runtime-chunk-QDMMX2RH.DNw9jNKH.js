import{t as e}from"./SplineRobot.astro_astro_type_script_index_0_lang.4c1ZWInz.js";import{$t as t,Dt as n,H as r,M as i,Mn as a,Nt as o,O as s,On as c,Or as l,Pr as u,T as d,U as f,Ur as p,Ut as m,Wn as h,Wr as g,Yr as _,ai as v,bt as ee,c as te,er as ne,ft as re,g as ie,li as ae,s as y,ut as b,yi as oe,zn as x,zr as se}from"./runtime-chunk-BVVSZMXD.D1AYhCn7.js";import{n as S}from"./runtime-chunk-ML3Z74BL.NNqON7l0.js";import{i as ce,l as C,s as w}from"./runtime-chunk-TZCHGFVF.3CJiZcdT.js";import{Ct as le,G as ue,U as de,Z as fe,at as pe,q as me,wt as he,yt as ge}from"./runtime-chunk-K3UQCG3P.fe_o4yqh.js";import{a as _e,c as T,i as ve,l as E,n as ye,r as D,t as O}from"./runtime-chunk-2PT2WH66.xlOF4GJL.js";import{_ as be,c as xe,n as Se,t as Ce,y as k}from"./runtime-chunk-PUFOPNOK.B0mu6qT8.js";import{Q as we,V as Te,nt as Ee,y as A}from"./runtime-chunk-JB6TDVGN.CwpFRUJQ.js";import{n as De,t as Oe}from"./runtime-chunk-564IIVBV.CgnbDq4j.js";import{r as ke}from"./runtime-chunk-JAELIJQZ.DNy-0oOH.js";import{a as j,i as M,n as N,o as Ae}from"./runtime-chunk-DUQ2PW7L.D2tDmEOg.js";import{t as je}from"./runtime-chunk-LGRD54SI.DS-C2XlD.js";import{t as Me}from"./runtime-chunk-E4IP6WPJ.DVcHCOrH.js";import{t as P}from"./runtime-chunk-LU45RPBP.DwxY2KCe.js";import{n as Ne,t as Pe}from"./runtime-chunk-LYYY4YGG.CqYx3JDV.js";import{t as F}from"./runtime-chunk-JVQBFLYF.CAFXMSkw.js";import{a as Fe,i as Ie,n as Le,o as I,s as Re}from"./runtime-chunk-QRYUKNF2.Dv5GE_e9.js";import{t as ze}from"./runtime-chunk-PE7JIDJV.CoLtmSZW.js";import{t as Be}from"./runtime-chunk-XFDV5BI7.7MNrTkb3.js";import{n as Ve}from"./runtime-chunk-BJXRV54U.BmfZ6bDb.js";var L=null;function He(e){L=e}var Ue=new WeakMap,We=1;function Ge(e){let t=Ue.get(e);return t===void 0&&(t=We++,Ue.set(e,t)),t}function Ke(e,t,n,r){let i=e,a=t;return[Ge(n),Ge(r),i.layers?.mask??0,i.renderOrder??0,+(!0===(i.castShadow??a.castShadow)),+(!0===(i.receiveShadow??a.receiveShadow))].join(`:`)}var R=[8,32,128,512],qe=R[R.length-1],z=new y().makeScale(0,0,0),Je=class extends _{constructor(e,t,n,r){super(e,t,n),this.isInstanceGroup=!0,this.members=Array(n).fill(null),this.raycast=()=>{},this.matrixAutoUpdate=!1,this.frustumCulled=!1,this.adoptPassState(r);for(let e=0;e<n;e++)this.setMatrixAt(e,z);this.instanceMatrix.needsUpdate=!0}adoptPassState(e){this.layers.mask=e.layers.mask,this.renderOrder=e.renderOrder,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow}assign(e,t){this.members[e]=t}writeSlot(e,t,n){return!1===n?(this.setMatrixAt(e,z),!1):(this.setMatrixAt(e,t.matrixWorld),!0)}park(e){this.members[e]=null,this.setMatrixAt(e,z)}get memberCount(){let e=0;for(let t of this.members)t!==null&&e++;return e}};function Ye(e,t){let n=t.get(e);if(n!==void 0)return n;let r=e.visible&&(e.parent===null||Ye(e.parent,t));return t.set(e,r),r}var Xe=class{constructor(e=8){this.minGroupSize=e,this.groups=[],this.groupKeys=new WeakMap,this.placements=new Map,this.visibilityMemo=new Map,this.page=null,this.stats={instancingGroups:0,instancedDrawsSaved:0,instancingRegroups:0,instancingParks:0,instancingIneligible:{}}}update(e,t){this.page!==e&&(this.teardown(),this.page=e,t=!0),!0===e.matrixWorldAutoUpdate&&e.updateMatrixWorld(),t&&this.reconcile(e),this.refresh()}reconcile(e){let t={},n=new Map;e.traverse(e=>{if(!0===e.isInstanceGroup)return;let r=function(e){if(!0!==e.isMesh)return`not-a-mesh`;if(D(e)||T(e)||E(e)||_e(e))return`excluded-type`;let t=function(e){let t=ye(e)?e.object:e;return t.geometry===void 0?void 0:t}(e);if(t===void 0)return`not-a-mesh`;let n=t.material;if(n===void 0)return`not-a-mesh`;if(Array.isArray(n))return`array-material`;let r=t.builtSharedGeometry;if(r===void 0)return`unrealized-geometry`;if(!function(e){return!0===e.isShared}(r))return`unshared-geometry`;if(r.attributes.position===void 0)return`empty-geometry`;if(r.morphAttributes.position!==void 0)return`morph`;if(!0===t.isSkinnedMesh)return`skinned`;let i=t.morphTargetInfluences;if(i!==void 0&&i.length>0)return`morph`;if(r.drawRange.start!==0||r.drawRange.count!==1/0)return`draw-range`;let a=n;return a.positionNode!=null||a.castShadowPositionNode!=null?`position-node`:!0===a.transparent?`transparent`:t.userData?.__splinePlanarMirror===void 0?function(e){let t=e;for(;t!==null;){let e=t.states;if(e!==void 0&&Object.keys(e).length>0)return!0;t=t.parent}return!1}(t)?`interaction-states`:{object:e,owner:t,geometry:r,material:n,key:Ke(e,t,r,n)}:`reflection`}(e);if(typeof r==`string`)return void(t[r]=(t[r]??0)+1);let i=n.get(r.key);i===void 0?n.set(r.key,[r]):i.push(r)});let r=new Map;for(let[e,t]of n)for(let n of t)r.set(n.object,e);let i=!1;for(let[e,t]of this.placements)r.get(e)!==this.groupKeys.get(t.group)&&this.parkPlacement(e,t);for(let e=this.groups.length-1;e>=0;e--){let t=this.groups[e];t.memberCount>=this.minGroupSize||(this.destroyGroup(t),this.groups.splice(e,1),i=!0)}for(let[t,r]of n){let n=r.filter(e=>!this.placements.has(e.object));if(n.length===0)continue;let a=0;for(let e of this.groups){if(a>=n.length)break;if(this.groupKeys.get(e)!==t)continue;let{members:r}=e;for(let t=0;t<r.length&&a<n.length;t++)r[t]===null&&this.place(e,t,n[a++].object)}for(;n.length-a>=this.minGroupSize;){let r=n.slice(a,a+qe);this.groups.push(this.createGroup(e,t,r)),a+=r.length,i=!0}}i&&this.stats.instancingRegroups++,this.publishGroupStats(),this.stats.instancingIneligible=t}createGroup(e,t,n){let r=n[0],i=new Je(r.geometry,r.material,function(e){for(let t of R)if(e<=t)return t;return qe}(n.length),r.object);this.groupKeys.set(i,t);for(let e=0;e<n.length;e++)this.place(i,e,n[e].object);return e.add(i),i}destroyGroup(e){for(let t=0;t<e.members.length;t++){let n=e.members[t];n!==null&&this.parkPlacement(n,{group:e,slot:t})}e.removeFromParent(),e.dispose()}place(e,t,n){e.assign(t,n),this.placements.set(n,{group:e,slot:t}),n.isDrawSuppressed=!0}parkPlacement(e,t){t.group.park(t.slot),t.group.instanceMatrix.needsUpdate=!0,this.placements.delete(e),e.isDrawSuppressed=!1,this.stats.instancingParks++}refresh(){this.visibilityMemo.clear();for(let e of this.groups){let{members:t}=e,n=null;for(let r=0;r<t.length;r++){let i=t[r];i!==null&&(n===null&&(n=i),e.writeSlot(r,i,Ye(i,this.visibilityMemo)))}n!==null&&(e.adoptPassState(n),e.instanceMatrix.needsUpdate=!0)}}teardown(){for(let e of this.groups)this.destroyGroup(e);this.groups.length=0;for(let e of this.placements.keys())e.isDrawSuppressed=!1;this.placements.clear(),this.publishGroupStats()}dispose(){this.teardown(),this.page=null}publishGroupStats(){let e=0;for(let t of this.groups){let n=t.memberCount;n>0&&(e+=n-1)}this.stats.instancingGroups=this.groups.length,this.stats.instancedDrawsSaved=e}},B=function(){let e=new Float32Array(1),t=new Int32Array(e.buffer);return function(n){return e[0]=n,t[0]}}(),Ze=function(e,t,n,r){return e+(t<<8)+(n<<16)+(r<<24)},V=new s;function Qe(e){let t=!1;return e.scene.objects.traverse((e,n)=>{if(!1===n.visible)return!0;n.type===`Splat`&&(t=!0)}),t}var $e,et,H=class extends t{constructor(e,t,n,r,i=!1,a=1,o,s){super(n,r),this.splatCount=t,this.meshIndexIntervals=o,this.meshMatrixWorlds=s,this.splatBuffers=e,this.geometry=n,this.material=r,this.splatDataTextures=null,this.halfPrecisionCovariancesOnGPU=i,this.devicePixelRatio=a,this.resetLocalSplatDataAndTexturesFromSplatBuffer()}static buildMesh(e,t,n=!1,r=1,i,a){return new H(e,t,H.buildGeomtery(t),H.buildMaterial(i),n,r,i,a)}static buildMaterial(e){return Te()===`webgpu`&&L?L.createSplatMaterial(e):new g({uniforms:{covariancesTexture:{type:`t`,value:null},centersColorsTexture:{type:`t`,value:null},meshIndexIntervals:{value:e},meshMatrixWorldsTexture:{type:`t`,value:null},focal:{type:`v2`,value:new s},viewport:{type:`v2`,value:new s},basisViewport:{type:`v2`,value:new s},debugColor:{type:`v3`,value:new u},covariancesTextureSize:{type:`v2`,value:new s(1024,1024)},centersColorsTextureSize:{type:`v2`,value:new s(1024,1024)},orthoZoom:{type:`f`,value:-1}},vertexShader:`
            precision highp float;
            #include <common>

            attribute uint splatIndex;

            uniform highp sampler2D covariancesTexture;
            uniform highp usampler2D centersColorsTexture;
            uniform vec2 focal;
            uniform vec2 viewport;
            uniform vec2 basisViewport;
            uniform vec2 covariancesTextureSize;
            uniform vec2 centersColorsTextureSize;
						uniform highp sampler2D meshMatrixWorldsTexture;
						uniform uint meshIndexIntervals[257];
						uniform float orthoZoom;

            varying vec4 vColor;
            varying vec2 vUv;

            varying vec2 vPosition;

            const vec4 encodeNorm4 = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0);
            const uvec4 mask4 = uvec4(uint(0x000000FF), uint(0x0000FF00), uint(0x00FF0000), uint(0xFF000000));
            const uvec4 shift4 = uvec4(0, 8, 16, 24);
            vec4 uintToRGBAVec (uint u) {
               uvec4 urgba = mask4 & u;
               urgba = urgba >> shift4;
               vec4 rgba = vec4(urgba) * encodeNorm4;
               return rgba;
            }

            vec2 getDataUV(in int stride, in int offset, in vec2 dimensions) {
                vec2 samplerUV = vec2(0.0, 0.0);
                float d = float(splatIndex * uint(stride) + uint(offset)) / dimensions.x;
                samplerUV.y = float(floor(d)) / dimensions.y;
                samplerUV.x = fract(d);
                return samplerUV;
            }

            void main () {
                uvec4 sampledCenterColor = texture(centersColorsTexture, getDataUV(1, 0, centersColorsTextureSize));
                vec3 splatCenter = uintBitsToFloat(uvec3(sampledCenterColor.gba));
                vColor = uintToRGBAVec(sampledCenterColor.r);

                vPosition = position.xy * 2.0;

								uint meshIndex;
								for (int i = 1; i < 257; i++) {
									if (splatIndex < meshIndexIntervals[i]) {
										meshIndex = uint(i - 1);
										break;
									}
								}

								float strideMulmeshIndex = float(4u*meshIndex);
								float meshMatrixWorldsTextureLength = float(256*4);

								mat4 modelMat = mat4(
									texture(meshMatrixWorldsTexture, vec2((strideMulmeshIndex+0.0)/meshMatrixWorldsTextureLength, 0)),
									texture(meshMatrixWorldsTexture, vec2((strideMulmeshIndex+1.0)/meshMatrixWorldsTextureLength, 0)),
									texture(meshMatrixWorldsTexture, vec2((strideMulmeshIndex+2.0)/meshMatrixWorldsTextureLength, 0)),
									texture(meshMatrixWorldsTexture, vec2((strideMulmeshIndex+3.0)/meshMatrixWorldsTextureLength, 0))
								);
								mat4 modelViewMat = viewMatrix * modelMat;
								vec4 viewCenter = modelViewMat * vec4(splatCenter, 1.0); 
                vec4 clipCenter = projectionMatrix * viewCenter;

                vec2 sampledCovarianceA = texture(covariancesTexture, getDataUV(3, 0, covariancesTextureSize)).rg;
                vec2 sampledCovarianceB = texture(covariancesTexture, getDataUV(3, 1, covariancesTextureSize)).rg;
                vec2 sampledCovarianceC = texture(covariancesTexture, getDataUV(3, 2, covariancesTextureSize)).rg;

                vec3 cov3D_M11_M12_M13 = vec3(sampledCovarianceA.rg, sampledCovarianceB.r);
                vec3 cov3D_M22_M23_M33 = vec3(sampledCovarianceB.g, sampledCovarianceC.rg);

                
                mat3 Vrk = mat3(
                    cov3D_M11_M12_M13.x, cov3D_M11_M12_M13.y, cov3D_M11_M12_M13.z,
                    cov3D_M11_M12_M13.y, cov3D_M22_M23_M33.x, cov3D_M22_M23_M33.y,
                    cov3D_M11_M12_M13.z, cov3D_M22_M23_M33.y, cov3D_M22_M23_M33.z
                );
                float s = 1.0 / (viewCenter.z * viewCenter.z);

                mat3 W = transpose(mat3(modelViewMat));
                mat3 T = orthoZoom > 0.0 ? W : W * mat3(
									focal.x / viewCenter.z, 0., -(focal.x * viewCenter.x) * s,
									0., focal.y / viewCenter.z, -(focal.y * viewCenter.y) * s,
									0., 0., 0.
								);
                mat3 cov2Dm = transpose(T) * Vrk * T;
                cov2Dm[0][0] += 0.3;
                cov2Dm[1][1] += 0.3;

                
                
                
                
                vec3 cov2Dv = vec3(cov2Dm[0][0], cov2Dm[0][1], cov2Dm[1][1]);

                vec3 ndcCenter = clipCenter.xyz / clipCenter.w;

                
                
                
                
                
                
                
                
                float a = cov2Dv.x;
                float d = cov2Dv.z;
                float b = cov2Dv.y;
                float D = a * d - b * b;
                float trace = a + d;
                float traceOver2 = 0.5 * trace;
                float term2 = sqrt(trace * trace / 4.0 - D);
                float eigenValue1 = traceOver2 + term2;
								float eigenValue2 = max(traceOver2 - term2, 0.00); 

                const float maxSplatSize = 1024.0;
                vec2 eigenVector1 = normalize(vec2(b, eigenValue1 - a));
                
                vec2 eigenVector2 = vec2(eigenVector1.y, -eigenVector1.x);
                vec2 basisVector1 = eigenVector1 * min(sqrt(2.0 * eigenValue1), maxSplatSize);
                vec2 basisVector2 = eigenVector2 * min(sqrt(2.0 * eigenValue2), maxSplatSize);

                vec2 ndcOffset = vec2(vPosition.x * basisVector1 + vPosition.y * basisVector2) * basisViewport;

								if (orthoZoom > 0.0) {
									ndcOffset *= orthoZoom;
								}

                gl_Position = vec4(ndcCenter.xy + ndcOffset, ndcCenter.z, 1.0);
            }`,fragmentShader:`
            precision highp float;
            #include <common>

            uniform vec3 debugColor;

            varying vec4 vColor;
            varying vec2 vUv;

            varying vec2 vPosition;
						layout(location = 1) out vec4 gVelocity; 

            void main () {
                
                
                float A = -dot(vPosition, vPosition);
                if (A < -4.0) discard;
                vec3 color = vColor.rgb;
                A = exp(A) * vColor.a;
                gl_FragColor = vec4(color.rgb, A);
								gVelocity = vec4(0.0); 
            }`,transparent:!0,alphaTest:1,blending:1,depthTest:!0,depthWrite:!1,side:2})}static buildGeomtery(e){let t=new x;t.setIndex([0,1,2,0,2,3]);let n=new l(new Float32Array(12),3);t.setAttribute(`position`,n),n.setXYZ(0,-1,-1,0),n.setXYZ(1,-1,1,0),n.setXYZ(2,1,1,0),n.setXYZ(3,1,-1,0),n.needsUpdate=!0;let r=new a().copy(t),i=new c(new Uint32Array(e),1,!1);return i.setUsage(ae),r.setAttribute(`splatIndex`,i),r.instanceCount=e,r}resetLocalSplatDataAndTexturesFromSplatBuffer(){this.updateLocalSplatDataFromSplatBuffer(),this.allocateAndStoreLocalSplatDataInTextures()}updateLocalSplatDataFromSplatBuffer(){this.splatBuffers.forEach(e=>e.buildPreComputedBuffers()),this.covariances=new Float32Array(6*this.splatCount),this.colors=new Uint8Array(4*this.splatCount),this.centers=new Float32Array(3*this.splatCount);let e=0,t=0,n=0;for(let r of this.splatBuffers){let i=r.nsplats;this.colors.subarray(e,e+4*i).set(r.colorsA),e+=4*i,this.centers.subarray(t,t+3*i).set(r.decoded.xyz.denormDequant().data),t+=3*i,this.covariances.subarray(n,n+6*i).set(new Float32Array(r.precomputedCovarianceBufferData)),n+=6*i}}allocateAndStoreLocalSplatDataInTextures(){let e=this.splatCount,t=new s(4096,1024);for(;t.x*t.y*2<6*e;)t.y*=2;let r,i,a=new s(4096,1024);for(;a.x*a.y*4<4*e;)a.y*=2;if(this.halfPrecisionCovariancesOnGPU){i=new Uint16Array(t.x*t.y*2);for(let e=0;e<this.covariances.length;e++)i[e]=m.toHalfFloat(this.covariances[e]);r=new b(i,t.x,t.y,ie,n)}else i=new Float32Array(t.x*t.y*2),i.set(this.covariances),r=new b(i,t.x,t.y,ie,oe);r.needsUpdate=!0,this.material.uniforms.covariancesTexture.value=r,this.material.uniforms.covariancesTextureSize.value.copy(t);let o=new Uint32Array(a.x*a.y*4);for(let t=0;t<e;t++){let e=4*t,n=3*t,r=4*t;o[r]=Ze(this.colors[e],this.colors[e+1],this.colors[e+2],this.colors[e+3]),o[r+1]=B(this.centers[n]),o[r+2]=B(this.centers[n+1]),o[r+3]=B(this.centers[n+2])}let c=new b(o,a.x,a.y,ne,te);Te()!==`webgpu`&&(c.internalFormat=`RGBA32UI`),c.needsUpdate=!0,this.material.uniforms.centersColorsTexture.value=c,this.material.uniforms.centersColorsTextureSize.value.copy(a);let l=new Float32Array(4096);for(let e=0;e<this.meshMatrixWorlds.length;e++)l.set(this.meshMatrixWorlds[e].elements,16*e);let u=new b(l,1024,1,ee,oe);u.needsUpdate=!0,this.material.uniforms.meshMatrixWorldsTexture.value=u,this.material.uniformsNeedUpdate=!0,this.splatDataTextures={covariances:{data:i,texture:r,size:t},centerColors:{data:o,texture:c,size:a},meshMatrixWorlds:{data:l,texture:u}}}updateIndexes(e){let t=this.geometry;t.attributes.splatIndex.set(e),t.attributes.splatIndex.needsUpdate=!0,t.instanceCount=e.length}updateUniforms(e,t,n,r){this.splatCount>0&&(V.set(e.x*this.devicePixelRatio,e.y*this.devicePixelRatio),this.material.uniforms.viewport.value.copy(V),this.material.uniforms.basisViewport.value.set(2/V.x,2/V.y),this.material.uniforms.focal.value.set(t,n),this.material.uniforms.orthoZoom.value=r,this.material.uniformsNeedUpdate=!0)}getSplatDataTextures(){return this.splatDataTextures}getSplatCount(){return this.splatCount}getCenters(){return this.centers}getColors(){return this.colors}getCovariances(){return this.covariances}dispose(){this.geometry.dispose(),this.material.dispose(),this.splatDataTextures&&(this.splatDataTextures.covariances.texture.dispose(),this.splatDataTextures.centerColors.texture.dispose(),this.splatDataTextures.meshMatrixWorlds.texture.dispose()),this.removeFromParent()}},tt=new Promise(e=>{$e=e}),nt=!1;function rt(){if(!nt)return et||=async function(){let t=await e(()=>import(`./gaussian-splat-compression.c0WMSbNU.js`),[]);$e(t),nt=!0}()}var U=new y,W=new se,G=new r,K=new r,q=new r,J=new r,it=new r,Y=new r;function at(e,t,n){n.length=0;let{axis:r,sign:i,limit:a}=t;for(let t=0;t<e.length;t++){let o=e[t],s=e[(t+1)%e.length],c=(r===0?o.px:r===1?o.py:o.pz)*i-a,l=(r===0?s.px:r===1?s.py:s.pz)*i-a,u=c<=0,d=l<=0;if(u&&n.push(o),u!==d){let e=c/(c-l);n.push({px:o.px+(s.px-o.px)*e,py:o.py+(s.py-o.py)*e,pz:o.pz+(s.pz-o.pz)*e,nx:o.nx+(s.nx-o.nx)*e,ny:o.ny+(s.ny-o.ny)*e,nz:o.nz+(s.nz-o.nz)*e})}}return n}function ot(e,t,n,r,i,a,o,s,c){let l=e.geometry,u=l.getAttribute(`position`);if(u===void 0||u.count===0)return!0;let d=l.getAttribute(`normal`),f=l.getIndex(),p=f===null?u.count:f.count;if(p>15e5)return!0;let m=l.drawRange.start,h=m+(l.drawRange.count===1/0?p-m:Math.min(l.drawRange.count,p-m));U.copy(e.objectToDecal),W.getNormalMatrix(U);let g=[],_=[];for(let e=m;e+2<h;e+=3){let l=f===null?e:f.getX(e),p=f===null?e+1:f.getX(e+1),m=f===null?e+2:f.getX(e+2);if(G.fromBufferAttribute(u,l).applyMatrix4(U),K.fromBufferAttribute(u,p).applyMatrix4(U),q.fromBufferAttribute(u,m).applyMatrix4(U),G.z>n&&K.z>n&&q.z>n||G.z<-n&&K.z<-n&&q.z<-n)continue;J.subVectors(K,G),it.subVectors(q,G),Y.crossVectors(J,it);let h=Y.length();if(!(h===0||Y.z/h<=.01)){if(g.length=0,d!==void 0)J.fromBufferAttribute(d,l).applyMatrix3(W),g.push({px:G.x,py:G.y,pz:G.z,nx:J.x,ny:J.y,nz:J.z}),J.fromBufferAttribute(d,p).applyMatrix3(W),g.push({px:K.x,py:K.y,pz:K.z,nx:J.x,ny:J.y,nz:J.z}),J.fromBufferAttribute(d,m).applyMatrix3(W),g.push({px:q.x,py:q.y,pz:q.z,nx:J.x,ny:J.y,nz:J.z});else{Y.divideScalar(h);for(let e of[G,K,q])g.push({px:e.x,py:e.y,pz:e.z,nx:Y.x,ny:Y.y,nz:Y.z})}for(let e of t){if(g.length===0)break;let t=at(g,e,_);_=g,g=t}if(!(g.length<3)){if(o.length/3+3*(g.length-2)>3e5)return!1;for(let e=1;e+1<g.length;e++)for(let t of[g[0],g[e],g[e+1]]){c.push(t.px*r+.5,t.py*i+.5);let e=t.nx,n=t.ny,l=t.nz,u=Math.hypot(e,n,l);u>0?(e/=u,n/=u,l/=u):(e=0,n=0,l=1),o.push(t.px+e*a,t.py+n*a,t.pz+l*a),s.push(e,n,l)}}}}return!0}var X=new v,st=new v,ct=new y,lt=new r,Z=class extends Ee{constructor(e,t,n){super(e,t),this.data=t,this.geometry=new x,this.lastSignature=[],this.nextSignature=[],this.scanned=[],this.lastParams={width:0,height:0,depth:0,offset:0},this.targetFilter=new Set,this.context=n;let r=this.data.geometry;this.lastParams={width:this.resolveNumber(r.width,0),height:this.resolveNumber(r.height,0),depth:this.resolveNumber(r.depth,0),offset:r.offset??0},this.geometry.userData={type:`DecalGeometry`,parameters:{...this.lastParams}}}get isLOD(){return this.updateDecal(),!1}get isDecalObject(){return!0}resolveNumber(e,t){if(typeof e==`number`)return e;let n=Number(this.context.shared.getVariable(e));return Number.isFinite(n)?n:t}currentParams(){let e=this.dataPatched.geometry;return{width:this.resolveNumber(e.width,this.lastParams.width),height:this.resolveNumber(e.height,this.lastParams.height),depth:this.resolveNumber(e.depth,this.lastParams.depth),offset:e.offset??0}}projectionRoot(){let e=this.parent;for(;e!==null&&k.is(e);){if(e.data?.type===`Page`)return e;e=e.parent}return this.context.scene}currentTargetFilter(){let e=this.dataPatched.geometry;if(e.projection!==`select`)return null;let t=e.projectionTargets;if(t!==this.targetFilterSource&&(this.targetFilterSource=t,this.targetFilter.clear(),t!==void 0))for(let e of t)this.targetFilter.add(e);return this.targetFilter}static matchesTargetFilter(e,t,n){let r=e;for(;r!==null&&r!==n;){if(t.has(r.uuid))return!0;r=r.parent}return!1}scanTargets(e,t,n){let r=this.scanned;r.length=0;let i=this.projectionRoot();if(i===null)return r;let a=this.currentTargetFilter();if(a!==null&&a.size===0)return r;X.makeEmpty();for(let r=0;r<8;r++)lt.set((1&r?.5:-.5)*e,(2&r?.5:-.5)*t,(4&r?.5:-.5)*n).applyMatrix4(this.matrixWorld),X.expandByPoint(lt);return i.traverse(e=>{if(e===this||!k.is(e)||!(e instanceof be)||e instanceof Z||e.dataPatched?.type!==`Mesh`||!e.visible||e.destroyedInAction||512&e.layers.mask||a!==null&&!Z.matchesTargetFilter(e,a,i))return;let t=e.geometry,n=t?.getAttribute(`position`);n===void 0||n.count===0||t.drawRange.count!==0&&(t.boundingBox===null&&t.computeBoundingBox(),st.copy(t.boundingBox).applyMatrix4(e.matrixWorld),X.intersectsBox(st)&&r.push(e))}),r}collectSignature(e,t,n){e.length=0,e.push(n.width,n.height,n.depth,n.offset);for(let t of this.matrixWorld.elements)e.push(t);for(let n of t){e.push(n.id,n.geometry.id);let t=n.geometry.getAttribute(`position`);e.push(t===void 0?-1:`version`in t?t.version:t.data.version);let r=n.geometry.getIndex();e.push(r===null?-1:r.version),e.push(n.geometry.drawRange.count===1/0?-1:n.geometry.drawRange.count);for(let t of n.matrixWorld.elements)e.push(t)}}signaturesEqual(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}updateDecal(){if(this.disposed)return!1;this.updateWorldMatrix(!0,!1);let e=this.currentParams(),t=this.scanTargets(e.width,e.height,e.depth);if(this.collectSignature(this.nextSignature,t,e),this.signaturesEqual(this.nextSignature,this.lastSignature))return!1;let n=this.lastSignature;this.lastSignature=this.nextSignature,this.nextSignature=n,this.lastParams=e,ct.copy(this.matrixWorld).invert();let r=t.map(e=>({geometry:e.geometry,objectToDecal:new y().multiplyMatrices(ct,e.matrixWorld)}));return this.geometry.dispose(),this.geometry=function(e,t){let n=Math.max(Math.abs(t.width),1e-6),r=Math.max(Math.abs(t.height),1e-6),a=Math.max(Math.abs(t.depth),1e-6),o=[{axis:0,sign:1,limit:n/2},{axis:0,sign:-1,limit:n/2},{axis:1,sign:1,limit:r/2},{axis:1,sign:-1,limit:r/2},{axis:2,sign:1,limit:a/2},{axis:2,sign:-1,limit:a/2}],s=[],c=[],l=[];for(let i of e)if(!ot(i,o,a/2,1/n,1/r,t.offset,s,c,l))break;let u=new x;return u.setAttribute(`position`,new i(s,3)),u.setAttribute(`normal`,new i(c,3)),u.setAttribute(`uv`,new i(l,2)),s.length===0?(u.setDrawRange(0,0),u.boundingSphere=new f):u.computeBoundingSphere(),u}(r,e),this.geometry.userData={type:`DecalGeometry`,parameters:{width:e.width,height:e.height,depth:e.depth}},Oe(this),De(this),this.resetBBoxNeedsUpdate(),!0}updateByPatchedOp(e,t,n){super.updateByPatchedOp(e,t,n),xe(e.path,[`geometry`])&&this.resetBBoxNeedsUpdate()}updateEntityBoxSize(e,t){let n=this.currentParams();e.setScalar(0),t.set(n.width,n.height,n.depth).multiplyScalar(.5)}dispose(){super.dispose(),this.geometry.dispose()}},ut=class extends ke(d,Me){constructor(e,t){super(),this.super_Entity(e,t),this.objectHelper.update(),this.matrixAutoUpdate=!0}updateState(e,t){this.updateState_Entity(e,t)}},Q=function(){try{let e=window.location.href;if(e.includes(`reducesubdiv=`)){let t=e.indexOf(`reducesubdiv=`)+13;return parseInt(e.slice(t,t+1))}}catch{}}();function dt(e,t,n){if(console.assert(t.type!==void 0),t.type===`Mesh`)return function(e,t,n){let r;if(Q!==void 0&&t?.geometry&&`subdivisions`in t.geometry&&(t.geometry.subdivisions??0)>Q&&Object.assign(t.geometry,{subdivisions:Q}),t.geometry.type===`TextGeometry`||t.geometry.type===`InputGeometry`){let r=w(t.geometry.type);return r?r(e,t,n):(C(t.geometry.type===`InputGeometry`?`textinputs`:`text`,`a Mesh with ${t.geometry.type}`),new A(e,t,n))}if(t.geometry.type===`SubdivGeometry`)r=new Ve(e,t,n);else if(t.geometry.type===`PathGeometry`||t.geometry.type===`VectorGeometry`||t.geometry.type===`ShapeBlendGeometry`){let i=w(t.geometry.type);i?r=i(e,t,n):(C(t.geometry.type===`ShapeBlendGeometry`?`shape-blends`:t.geometry.type===`PathGeometry`?`3d-paths`:`vector-shapes`,`a Mesh with ${t.geometry.type}`),r=new A(e,t,n))}else if(t.geometry.type===`BooleanGeometry`)r=new M(e,t,n);else if(t.geometry.type===`DecalGeometry`)r=new Z(e,t,n);else if(t.geometry.type===`UIGeometry`){let i=w(`UIGeometry`);i?r=i(e,t,n):(C(`ui-2d`,`a Mesh with UIGeometry`),r=new A(e,t,n))}else r=new A(e,t,n);return r}(e,t,n);if(t.type===`Empty`)return new P(e,t);if(t.type===`Particle`){let r=ce(`Particle`);return r?r(e,t,n):(C(`particles`,`a Particle system`),new P(e,t))}if(t.type===`ParticleCollider`)return new Be(e,t,n);if(t.type===`Hair`){let r=ce(`Hair`);return r?r(e,t,n):(C(`hair`,`a Hair System`),new P(e,t))}if(t.type===`Splat`)return new P(e,t);if(t.type===`Bone`)return new ut(e,t);if(t.type===`Page`)return new I(e,t,n);if(t.type===`PointLight`)return new je(e,t,n);if(t.type===`SpotLight`)return new Ne(e,t,n);if(t.type===`DirectionalLight`)return new Pe(e,t,n);if(t.type===`Component`||t.type===`Instance`){let r=ce(t.type);return r?r(e,t,n):(C(`components`,`a ${t.type}`),new P(e,t))}return ge.is(t.type)?new F(e,t):(console.error(t),new P(e,t))}Se.createEntity=dt,Se.changeEntityProptotype=function(e,t,n){let r=dt(e.identity,t,n),i=e.children,a=e.attachedPaths,o=e.parent,s=e.component,c=e.instances,l=e.overrideData,u=e.uuid,d=e.stateSelection;e.dispose();for(let t of Object.keys(e))delete e[t];Object.setPrototypeOf(e,Object.getPrototypeOf(r));for(let t of Object.keys(r))e[t]=r[t];e.children=[...e.children,...i],e.attachedPaths=a,e.parent=o,e.component=s,e.instances=c,e.uuid=u,e.overrideData=l,e.updateState(e.data,n),d&&e.changeSelectedState(d,n),e.resetBBoxNeedsUpdate()};var ft,pt=class{constructor(){this._constraints=new Map}setConstraint(e,t){t===null?this._constraints.delete(e):this._constraints.set(e,t)}removeDependencies(e){this._constraints.delete(e)}applyConstraints(e){let t=new Set;this._constraints.forEach((n,r)=>{let i=[r,n],a=n;for(;this._constraints.has(a);){if(a=this._constraints.get(a),i.includes(a)){console.warn(`circular dependency detected: ${i.join(` -> `)}`);break}t.has(a)||i.push(a)}for(let n=i.length-2;n>=0;n--)if(!t.has(i[n])){let r=e.find(i[n]);r?r.applyPathSnapping(e):console.warn(`missing entity ${i[n]}`),t.add(i[n])}})}findDependency(e,t){let n=e;for(;this._constraints.has(n);)if(n=this._constraints.get(n),n===t)return!0;return!1}},$=class{};S($,`DepthMapRange`,65536),S($,`MemoryPageSize`,65536),S($,`BytesPerFloat`,4),S($,`BytesPerInt`,4),tt.then(e=>ft=e);var mt=class{constructor(e={}){S(this,`updateView`,function(){let e=new y,t=[],n=new r(0,0,-1),i=new r(0,0,-1),a=new r,o=new r;return function(r=!1,s){let c=this.updateMatrixWorldsInWorkerIfNeeded(),l=this.cropsChanged();if(!r){i.set(0,0,-1).applyQuaternion(s.quaternion);let e=!1,t=!1;if(i.dot(n)<=.95&&(e=!0),o.copy(s.position).sub(a).length()>=1&&(t=!0),!(e||t||c||l||this.needsInitialRender))return}this.needsInitialRender=!1,a.copy(s.position),n.copy(i),e.copy(s.matrixWorld).invert(),e.premultiply(this.dummyPerspectiveMatrix),t[0]=s.position.x,t[1]=s.position.y,t[2]=s.position.z;let u={sort:{view:e.elements,cameraPosition:t,splatRenderCount:this.splatRenderCount,splatSortCount:this.splatRenderCount},...c?{newMatrixWorlds:this.meshMatrixWorlds}:{},...l?{newCropsArray:this.cropsArray}:{}};this.sortRunning?this.queuedMessage=u:(this.queuedMessage=null,this.sortRunning=!0,this.sortWorker.postMessage(u))}}()),this.scene=e.scene,this.currentPage=null,this.devicePixelRatio=window.devicePixelRatio,this.sortWorker=null,this.splatRenderCount=0,this.splatSortCount=0,this.splatMesh=null,this.sortRunning=!1,this.meshMatrixWorlds=null,this.meshMatrixWorldsOld=null,this.cropsArray=null,this.splatEntries=null,this.queuedMessage=null,this.needsInitialRender=!0,this.dummyPerspectiveMatrix=new y().makePerspective(-1,1,-1,1,.1,1e3)}updateSplatMeshUniforms(e,t){let n=new s;this.splatMesh!==null&&this.splatMesh.getSplatCount()>0&&(e.getSize(n),this.cameraFocalLengthX=t.projectionMatrix.elements[0]*this.devicePixelRatio*n.x*.45,this.cameraFocalLengthY=t.projectionMatrix.elements[5]*this.devicePixelRatio*n.y*.45,this.splatMesh.updateUniforms(n,this.cameraFocalLengthX,this.cameraFocalLengthY,t.isPerspectiveCamera?-1:t.zoom*this.devicePixelRatio))}loadSplat(e={}){this.activePage=this.scene.activePage,e.position&&=new r().fromArray(e.position),e.orientation&&=new re().fromArray(e.orientation),e.halfPrecisionCovariances=!!e.halfPrecisionCovariances;let t=[];if(this.splatEntries=t,this.activePage.traverseVisibleEntity(e=>{e.data.type===`Splat`&&t.push(e)}),this.splatMesh&&this.splatMesh.dispose(),t.length===0)return this.splatMesh=null,!1;this.meshMatrixWorlds=t.map(e=>e.matrixWorld),this.meshMatrixWorldsOld=t.map(e=>e.matrixWorld.clone()),this.cropsArray=t.map(e=>e.data.crops.map(e=>e.data)),this._splatBufferCache??=new WeakMap;let n=t.map(e=>{let t=this._splatBufferCache.get(e.data.buffer);return t===void 0&&(t=new ft.GSplineBuffer(new Uint8Array(e.data.buffer).buffer),this._splatBufferCache.set(e.data.buffer,t)),t}),i=0,a=[0];for(let e of n)i+=e.getSplatCount(),a.push(i);return this.setupSplatMesh(n,i,e.position,e.orientation,e.halfPrecisionCovariances,this.devicePixelRatio,a,this.meshMatrixWorlds),this.setupSortWorker(i),!0}updateMatrixWorldsInWorkerIfNeeded(){let e=this.splatDataTextures.meshMatrixWorlds.data;for(let t=0;t<this.meshMatrixWorlds.length;t++)e.set(this.meshMatrixWorlds[t].elements,16*t);return this.splatDataTextures.meshMatrixWorlds.texture.needsUpdate=!0,!this.meshMatrixWorlds.every((e,t)=>e.equals(this.meshMatrixWorldsOld[t]))&&(this.meshMatrixWorldsOld=this.meshMatrixWorlds.map(e=>e.clone()),!0)}cropsChanged(){let e=!1;return this.splatEntries.forEach((t,n)=>{t.data.crops.forEach((t,r)=>{this.cropsArray[n][r]===void 0?(e=!0,this.cropsArray[n][r]=t.data):Object.entries(t.data).forEach(([t,i])=>{(Array.isArray(i)&&i.some((e,i)=>e!==this.cropsArray[n][r][t][i])||i!==this.cropsArray[n][r]?.[t])&&(e=!0,this.cropsArray[n][r][t]=i)})}),t.data.crops.length!==this.cropsArray[n]?.length&&(this.cropsArray[n].length=t.data.crops.length,e=!0)}),e}setupSplatMesh(e,t,n=new r,i=new re,a=!1,o=1,s,c){this.splatMesh=H.buildMesh(e,t,a,o,s,c),this.splatMesh.position.copy(n),this.splatMesh.quaternion.copy(i),this.splatMesh.frustumCulled=!1,this.splatMesh.renderOrder=99999,this.splatRenderCount=t,this.splatMesh.onBeforeRender=(e,t,n)=>this.update(e,n)}setupSortWorker(e){this.sortWorker=function(e){let t=new Worker(URL.createObjectURL(new Blob([`(`,`
function sortWorker(self) {
	let wasmInstance;
	let splatCount;
	let splatRC;
	let indexesOffset;
	let positionsOffset;
	let viewProjOffset;
	let frequenciesOffset;
	let indexesOutOffset;
	let sortBuffersOffset;
	let wasmMemory;
	let positions;

	let Constants;
	let floatPositions;
	let meshIndexIntervals;
	let meshMatrixWorlds;
	let cropsArray;

	function sort(viewProj) {
		// console.time('WASM SORT');
		const viewProjArray = new Float64Array(wasmMemory, viewProjOffset, 16);
		for (let i = 0; i < 16; i++) {
			viewProjArray[i] = viewProj[i];
		}
		let indexesBuffer;
		// console.timeEnd('WASM SORT');
		if (splatRC > 1) {
			wasmInstance.exports.sortIndexes(
				indexesOffset,
				positionsOffset,
				sortBuffersOffset,
				viewProjOffset,
				frequenciesOffset,
				indexesOutOffset,
				Constants.DepthMapRange,
				splatRC
			);
			const indexes = new Uint32Array(splatRC);
			indexesBuffer = indexes.buffer;
			indexes.set(new Uint32Array(wasmMemory, indexesOutOffset, splatRC));
		} else if (splatRC === 1) {
			const indexes = new Uint32Array(splatRC);
			indexes[0] = new Uint32Array(wasmMemory, indexesOffset, splatCount)[0];
			indexesBuffer = indexes.buffer;
		} else {
			indexesBuffer = new ArrayBuffer(0);
		}

		self.postMessage(
			{
				sortDone: true,
				indexesBuffer,
			},
			[indexesBuffer]
		);
	}
	function updateRenderedSplats(
		meshMatrixWorlds,
		cropsArray,
		meshIndexIntervals
	) {
		const renderedPositions = new Float32Array(
			wasmMemory,
			positionsOffset,
			splatCount * 3
		);
		splatRC = 0;
		const wasmMemoryIndexes = new Uint32Array(
			wasmMemory,
			indexesOffset,
			splatCount
		);
		for (let i = 0; i < meshIndexIntervals.length - 1; i++) {
			const crops = cropsArray[i];
			const matrixWorld = meshMatrixWorlds[i].elements;
			const paramsIn = crops
				.filter((a) => a.enabled && a.mode === 'Include')
				.map((c) =>
					c.type === 'Box'
						? computeBoundingBoxVertices(c)
						: computeEllipsoidParams(c)
				);
			const paramsOut = crops
				.filter((a) => a.enabled && a.mode === 'Exclude')
				.map((c) =>
					c.type === 'Box'
						? computeBoundingBoxVertices(c)
						: computeEllipsoidParams(c)
				);
			for (let j = meshIndexIntervals[i]; j < meshIndexIntervals[i + 1]; j++) {
				const x = floatPositions[j * 3];
				const y = floatPositions[j * 3 + 1];
				const z = floatPositions[j * 3 + 2];
				if (
					(paramsIn.length === 0 || isInBounds(x, y, z, paramsIn)) &&
					(paramsOut.length === 0 || !isInBounds(x, y, z, paramsOut))
				) {
					const w =
						1 /
						(matrixWorld[3] * x +
							matrixWorld[7] * y +
							matrixWorld[11] * z +
							matrixWorld[15]);
					renderedPositions[splatRC * 3] =
						(matrixWorld[0] * x +
							matrixWorld[4] * y +
							matrixWorld[8] * z +
							matrixWorld[12]) *
						w;
					renderedPositions[splatRC * 3 + 1] =
						(matrixWorld[1] * x +
							matrixWorld[5] * y +
							matrixWorld[9] * z +
							matrixWorld[13]) *
						w;
					renderedPositions[splatRC * 3 + 2] =
						(matrixWorld[2] * x +
							matrixWorld[6] * y +
							matrixWorld[10] * z +
							matrixWorld[14]) *
						w;
					wasmMemoryIndexes[splatRC] = j;
					splatRC++;
				}
			}
		}
	}
	function getOutOfBoundsIndexes(floatPositions, crops) {
		const outOfBoundsIndexes = [];
		const paramsIn = crops
			.filter((a) => a.enabled && a.mode === 'Include')
			.map((c) =>
				c.type === 'Box'
					? computeBoundingBoxVertices(c)
					: computeEllipsoidParams(c)
			);
		const paramsOut = crops
			.filter((a) => a.enabled && a.mode === 'Exclude')
			.map((c) =>
				c.type === 'Box'
					? computeBoundingBoxVertices(c)
					: computeEllipsoidParams(c)
			);

		const len = floatPositions.length;
		for (let j = 0; j < len; j += 3) {
			const x = floatPositions[j];
			const y = floatPositions[j + 1];
			const z = floatPositions[j + 2];
			if (
				(paramsIn.length === 0 || isInBounds(x, y, z, paramsIn)) &&
				(paramsOut.length === 0 || !isInBounds(x, y, z, paramsOut))
			) {
				// in bounds: intentionally skip
			} else {
				outOfBoundsIndexes.push(j / 3);
			}
		}
		// console.log(outOfBoundsIndexes);
		return outOfBoundsIndexes;
	}

	function isInBounds(x, y, z, params, mode) {
		return params[mode === 'Intersect' ? 'every' : 'some']((param) => {
			const t = applyRotationMatrix(
				x,
				y,
				z,
				param.invRotationMatrix,
				param.cropCenter
			);
			return Array.isArray(param)
				? isVertexInsideBoundingBox(t.x, t.y, t.z, param)
				: isPointInsideEllipsoid(t.x, t.y, t.z, param);
		});
	}
	function applyRotationMatrix(_x, _y, _z, e, pivot) {
		const x = _x - pivot[0];
		const y = _y - pivot[1];
		const z = _z - pivot[2];
		const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
		return {
			x: (e[0] * x + e[4] * y + e[8] * z + e[12]) * w + pivot[0],
			y: (e[1] * x + e[5] * y + e[9] * z + e[13]) * w + pivot[1],
			z: (e[2] * x + e[6] * y + e[10] * z + e[14]) * w + pivot[2],
		};
	}
	function computeBoundingBoxVertices(box) {
		const halfSizeX = box.cropSize[0] / 2;
		const halfSizeY = box.cropSize[1] / 2;
		const halfSizeZ = box.cropSize[2] / 2;
		const bounds = [
			box.cropCenter[0] - halfSizeX,
			box.cropCenter[1] - halfSizeY,
			box.cropCenter[2] - halfSizeZ,
			box.cropCenter[0] + halfSizeX,
			box.cropCenter[1] + halfSizeY,
			box.cropCenter[2] + halfSizeZ,
		];
		const invRotationMatrix = getInvRotationMatrix(box.cropRotation);
		return Object.assign(bounds, {
			invRotationMatrix,
			cropCenter: box.cropCenter,
		});
	}
	function getInvRotationMatrix(_rotation) {
		const te = [];
		const x = (_rotation[0] * Math.PI) / 180,
			y = (_rotation[1] * Math.PI) / 180,
			z = (_rotation[2] * Math.PI) / 180;
		const a = Math.cos(x),
			b = Math.sin(x);
		const c = Math.cos(y),
			d = Math.sin(y);
		const e = Math.cos(z),
			f = Math.sin(z);
		const ae = a * e,
			af = a * f,
			be = b * e,
			bf = b * f;

		te[0] = c * e;
		te[1] = -c * f;
		te[2] = d;

		te[4] = af + be * d;
		te[5] = ae - bf * d;
		te[6] = -b * c;

		te[8] = bf - ae * d;
		te[9] = be + af * d;
		te[10] = a * c;

		te[12] = 0;
		te[13] = 0;
		te[14] = 0;

		te[3] = 0;
		te[7] = 0;
		te[11] = 0;
		te[15] = 1;

		return te;
	}
	function isVertexInsideBoundingBox(x, y, z, bounds) {
		return (
			x >= bounds[0] &&
			x <= bounds[3] &&
			y >= bounds[1] &&
			y <= bounds[4] &&
			z >= bounds[2] &&
			z <= bounds[5]
		);
	}
	function computeEllipsoidParams(ellipsoid) {
		// Precompute the scaling factors
		const invRadiusX = 2 / ellipsoid.cropSize[0];
		const invRadiusY = 2 / ellipsoid.cropSize[1];
		const invRadiusZ = 2 / ellipsoid.cropSize[2];
		const invRotationMatrix = getInvRotationMatrix(ellipsoid.cropRotation);
		return {
			invRadiusX,
			invRadiusY,
			invRadiusZ,
			cropCenter: ellipsoid.cropCenter,
			invRotationMatrix,
		};
	}
	function isPointInsideEllipsoid(x, y, z, ellipsoidParams) {
		const _x = (x - ellipsoidParams.cropCenter[0]) * ellipsoidParams.invRadiusX;
		const _y = (y - ellipsoidParams.cropCenter[1]) * ellipsoidParams.invRadiusY;
		const _z = (z - ellipsoidParams.cropCenter[2]) * ellipsoidParams.invRadiusZ;
		return _x * _x + _y * _y + _z * _z <= 1;
	}

	self.onmessage = (e) => {
		if (e.data.getCroppedIndexes) {
			const outOfBoundsIndexes = new Uint32Array(
				getOutOfBoundsIndexes(new Float32Array(e.data.positions), e.data.crops)
			).buffer;
			self.postMessage(
				{
					outOfBoundsIndexes,
				},
				[outOfBoundsIndexes]
			);
		} else if (e.data.positions) {
			positions = e.data.positions;
			floatPositions = new Float32Array(positions);
			meshMatrixWorlds = e.data.meshMatrixWorlds;
			cropsArray = e.data.cropsArray;
			meshIndexIntervals = e.data.meshIndexIntervals;
			updateRenderedSplats(meshMatrixWorlds, cropsArray, meshIndexIntervals);
			self.postMessage({
				sortSetupComplete: true,
			});
		} else if (e.data.sort || e.data.newMatrixWorlds || e.data.newCropsArray) {
			if (e.data.newMatrixWorlds || e.data.newCropsArray) {
				cropsArray = e.data.newCropsArray || cropsArray;
				meshMatrixWorlds = e.data.newMatrixWorlds || meshMatrixWorlds;
				updateRenderedSplats(meshMatrixWorlds, cropsArray, meshIndexIntervals);
			}
			sort(e.data.sort.view, e.data.sort.cameraPosition);
		} else if (e.data.init) {
			// Yep, this is super hacky and gross :(
			Constants = e.data.init.Constants;

			splatCount = e.data.init.splatCount;

			const INDEXES_BYTES_PER_ENTRY = Constants.BytesPerInt;
			const POSITIONS_BYTES_PER_ENTRY = Constants.BytesPerFloat * 3;

			const sorterWasmBytes = new Uint8Array(e.data.init.sorterWasmBytes);
			const memoryBytesPerVertex =
				INDEXES_BYTES_PER_ENTRY + POSITIONS_BYTES_PER_ENTRY;
			const memoryRequiredForVertices = splatCount * memoryBytesPerVertex;
			const memoryRequiredForSortBuffers =
				splatCount * Constants.BytesPerInt * 2 +
				Constants.DepthMapRange * Constants.BytesPerInt * 2;
			const extraMemory = Constants.MemoryPageSize * 32;
			const totalRequiredMemory =
				memoryRequiredForVertices + memoryRequiredForSortBuffers + extraMemory;
			const totalPagesRequired =
				Math.floor(totalRequiredMemory / Constants.MemoryPageSize) + 1;
			const sorterWasmImport = {
				module: {},
				env: {
					memory: new WebAssembly.Memory({
						initial: totalPagesRequired * 2,
						maximum: totalPagesRequired * 3,
						shared: true,
					}),
				},
			};
			WebAssembly.compile(sorterWasmBytes)
				.then((wasmModule) => {
					return WebAssembly.instantiate(wasmModule, sorterWasmImport);
				})
				.then((instance) => {
					wasmInstance = instance;
					indexesOffset = 0;
					positionsOffset = splatCount * INDEXES_BYTES_PER_ENTRY;
					viewProjOffset =
						positionsOffset + splatCount * POSITIONS_BYTES_PER_ENTRY;
					sortBuffersOffset = viewProjOffset + 16 * Constants.BytesPerFloat * 2;
					frequenciesOffset =
						sortBuffersOffset + splatCount * Constants.BytesPerInt;
					indexesOutOffset =
						frequenciesOffset + Constants.DepthMapRange * Constants.BytesPerInt;
					wasmMemory = sorterWasmImport.env.memory.buffer;
					self.postMessage({
						sortSetupPhase1Complete: true,
					});
				});
		}
	};
}
`,`)(self)`],{type:`application/javascript`}))),n=atob(`AGFzbQEAAAAADwhkeWxpbmsuMAEEAAAAAAETA2AAAGAIf39/f39/f38AYAABfwISAQNlbnYGbWVtb3J5AgMAgIAEAwQDAAECBzkDEV9fd2FzbV9jYWxsX2N0b3JzAAALc29ydEluZGV4ZXMAARNlbXNjcmlwdGVuX3Rsc19pbml0AAIK3gMDAwABC9IDAwF/BnwBfgJAIAdFDQAgAysDUCEMIAMrAzAhDSADKwMQIQ5BACEDRP///////+9/IQtEAAAAAAAAEAAhCgNAIAIgA0ECdGoCfyAOIAEgA0EMbGoiCCoCALuiIA0gCCoCBLuioCAMIAgqAgi7oqBEAAAAAAAAsECiIgmZRAAAAAAAAOBBYwRAIAmqDAELQYCAgIB4CzYCACAJIAsgCSALYxshCyAJIAogCSAKZBshCiADQQFqIgMgB0cNAAsgB0UNACAGuCAKIAuhoyEJQQAhAwNAAn8gCSACIANBAnRqIgEoAgC3IAuhoiIKmUQAAAAAAADgQWMEQCAKqgwBC0GAgICAeAshCCABIAg2AgAgBCAIQQJ0aiIBIAEoAgBBAWo2AgAgA0EBaiIDIAdHDQALCyAGQQJPBEAgBCgCACEIQQEhAwNAIAQgA0ECdGoiASABKAIAIAhqIgg2AgAgA0EBaiIDIAZHDQALCyAHQQFrIgGtIQ8DQCAEIAIgD6dBAnQiA2ooAgBBAnRqIgcgBygCAEEBayIHNgIAIAUgASAHa0ECdGogACADaigCADYCACAPUCEDIA9CAX0hDyADRQ0ACyAGBEAgBEEAIAZBAnT8CwALCwQAQQAL`),r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);return t.postMessage({init:{sorterWasmBytes:r.buffer,splatCount:e,Constants:{BytesPerFloat:$.BytesPerFloat,BytesPerInt:$.BytesPerInt,DepthMapRange:$.DepthMapRange,MemoryPageSize:$.MemoryPageSize}}}),t}(e),this.sortWorker.onmessage=e=>{e.data.sortDone?(this.sortRunning=!1,this.splatMesh?.updateIndexes(new Uint32Array(e.data.indexesBuffer)),this.lastSortTime=e.data.sortTime,this.queuedMessage&&=(this.sortWorker.postMessage(this.queuedMessage),null)):e.data.sortCanceled?this.sortRunning=!1:e.data.sortSetupPhase1Complete?this.sortWorker.postMessage({positions:this.splatMesh.getCenters().buffer,meshMatrixWorlds:this.splatMesh.meshMatrixWorlds,meshIndexIntervals:this.splatMesh.meshIndexIntervals,cropsArray:this.cropsArray}):e.data.sortSetupComplete&&(this.splatDataTextures=this.splatMesh.getSplatDataTextures(),this.scene.activePage.add(this.splatMesh),this.needsInitialRender=!0)}}update(e,t){this.splatMesh!==null&&(this.updateSplatMeshUniforms(e,t),this.updateView(!1,t))}getSplatMesh(){return this.splatMesh}},ht=new o;ht.wireframe=!0;var gt=new r,_t=class extends h{constructor(e,t){super(),this.data=e,this.sharedAssets=t,this.enableHelpers=!1,this.wireframeState=!1,this.needsTransmissionDirty=!0,this.needsNormalDirty=!0,this.needsReflectionDirty=!0,this._needsTransmission=!1,this._needsNormal=!1,this._normalPassNeeds={outline:!1,cavity:!1},this._needsReflection=!1,this.geometryCacheChanged=!1,this.splatViewer=null,this.shapeBlendIntances=[],this.hairInstances=[],this.shadowsDirty=!0,this.instanceGroupsDirty=!0,this._autoInstancing=null,this.entityByUuid={},this.entityIdentityToEntity={},this.toExpandCloner=new Set,this.toUpdateCloner=new Set,this.pendingCommands=[],this.pathConstraints=new pt,this.invisibleObjects=new P(`jflkdsafjasdifjaslk`,{...de.defaultData,visible:!1,name:`buildin invisible`}),this.needsRecomputeInstances=!1,this.init(e,t),this.matrixAutoUpdate=!1,this.errorPage=new I(`fdasfa`,{...he.defaultData,name:``},{shared:t,scene:this})}markGeometryCacheDirty(){this.geometryCacheChanged=!0}markShadowsDirty(){this.shadowsDirty=!0}markInstanceGroupsDirty(){this.instanceGroupsDirty=!0}get autoInstancing(){return this._autoInstancing}updateInstanceGroups(e,t){let n=this._autoInstancing;(n===null||n.minGroupSize!==t)&&(n?.dispose(),n=new Xe(t),this._autoInstancing=n);let r=this.instanceGroupsDirty;return this.instanceGroupsDirty=!1,n.update(e,r),n.stats}releaseInstanceGroups(){this._autoInstancing?.teardown(),this.instanceGroupsDirty=!0}markNeedsUpdateRendererDirty(){this.needsTransmissionDirty=!0,this.needsNormalDirty=!0,this.needsReflectionDirty=!0,this.shadowsDirty=!0,this.instanceGroupsDirty=!0}needsTransmission(){return this.needsTransmissionDirty&&=(this._needsTransmission=Le(this),!1),this._needsTransmission}needsNormal(){return this.needsNormalDirty&&=(this._normalPassNeeds=Re(this),this._needsNormal=this._normalPassNeeds.outline||this._normalPassNeeds.cavity,!1),this._needsNormal}normalPassNeeds(){return this.needsNormal(),this._normalPassNeeds}needsReflection(){return this.needsReflectionDirty&&=(this._needsReflection=Fe(this),!1),this._needsReflection}registerInstanceAndSetUuid(e){let t=e.identity.join(`-`),n=this.entityIdentityToEntity[t];n&&(e.uuid=n.uuid),this.entityIdentityToEntity[t]=e,this.entityByUuid[e.uuid]=e}markPenumbraSizeDirty(){for(let e of this.children)e instanceof I&&(e.penumbraSizeArrayCache=null)}findInstance(e){return this.entityIdentityToEntity[e.join(`-`)]}get bgColor(){return this.activePage.bgColor}get postprocessing(){return this.activePage.data.postprocessing}getWithSortKey(e){let t=this.find(e);if(t===void 0)return;let n=[],r=t;for(;r!==this;){let e=r;r=r.parent;let t=r.children.indexOf(e);n.splice(0,0,t)}return{entity:t,sortKey:n}}getAllSorted(e){let t=[];for(let n of e){let e=this.getWithSortKey(n.id);e!==void 0&&t.push(e)}return t.sort((e,t)=>fe(e.sortKey,t.sortKey)),t.map(e=>e.entity)}nonExistOrDescendantOf(e,t){let n=this.find(e);if(n===void 0)return!0;for(;n;){if(n.uuid===t)return!0;n=n.parent}return!1}find(e){if(this.activePage&&this.activePage.personalCamera.parent&&(e===`f23858d0-4a3b-4bd8-8173-66ed0af7f6fb-personalCamera`||e===`personal camera`))return this.activePage.personalCamera;if(e===``||e===void 0)return;let t=this.entityByUuid[e];return t===void 0?this.getObjectByProperty(`uuid`,e):t}find2D(e){for(let t of this.children)if(t instanceof I&&t.uiScene){let n=t.uiScene.find(e);if(n)return n}}findScene2DfromObject2D(e){for(let t of this.children)if(t instanceof I&&t.uiScene&&t.uiScene.find(e))return t.uiScene}find2DInUIObjects(e){let t;return this.traverseEntity(n=>{t===void 0&&T(n)&&(t=n.uiCanvas.find(e))}),t}traverse2D(e){for(let t of this.children)t instanceof I&&t.uiScene&&t.uiScene.traverse(e)}debugEnsureEntity(e){let t=this.find(e);t?Array.isArray(t.identity)&&this.findInstance(t.identity)===void 0&&console.error(`not found instance`):console.error(`not found`)}addPendingExpandCloner(e){this.toExpandCloner.add(e)}addPendingUpdateCloner(e){this.toUpdateCloner.add(e)}markToExpandCloner(e){this.toExpandCloner.add(e),e.traverseEntityAncestors(e=>{this.toExpandCloner.add(e)})}doPendingExpandCloner(e){this.toExpandCloner.forEach(t=>{t.expandCloner(e)}),this.toExpandCloner.clear()}doPendingUpdateCloner(e){this.toUpdateCloner.forEach(t=>{t.cloner?.update(e)}),this.toUpdateCloner.clear()}doPendingUpdates(e){this.doPendingExpandCloner(e),this.doPendingUpdateCloner(e),this.applyPendingCommands()}addPendingCommand(e){this.pendingCommands.push(e)}applyPendingCommands(){this.pendingCommands.forEach(e=>e()),this.pendingCommands.length=0}updateByLibOp(e,t){e.path.length===1&&e.path[0]===`components`&&e.type===1&&this.createChildrenObjects([{...e.data.asset,id:e.id}],this.invisibleObjects,t)}updateTreeByOp(e,t){if(e.path.length===0&&e.type===7){let n=e.parent===null?this:this.find(e.parent);if(n===void 0)throw Error(`scene tree add: parent ${e.parent} not found for object ${e.id}`);let r=this.createObject(e.id,e.data,e.children,n,e.localIndex,t);r.updateVisible(this),r.resetBBoxNeedsUpdate(),j(r)&&N(r.parent)&&(r.invalidateUpstreamBooleanData(),r.parent.invalidateDownstreamBooleanData().recomputeBoolean()),this.markNeedsRecomputeInstancesForAncessors(n),this.markNeedsRecomputeInstancesForChildren(r),this.markToExpandCloner(r),this.markPenumbraSizeDirty(),r.updatePathSnapping()}else if(e.path.length===0&&e.type===8){let t=this.find(e.id);if(t===void 0)throw Error(`scene tree delete: object ${e.id} not found`);t.traverseEntity(e=>{D(e)&&(this.shapeBlendIntances=this.shapeBlendIntances.filter(t=>t!==e)),E(e)&&(this.hairInstances=this.hairInstances.filter(t=>t!==e))}),this.markToExpandCloner(t),t.resetBBoxNeedsUpdate(),this.unregisterObject(t);let n=t.parent;this.markNeedsRecomputeInstancesForAncessors(n),this.markNeedsRecomputeInstancesForChildren(t),this.markPenumbraSizeDirty(),t.parent.remove(t),N(t.parent)&&(t.parent.invalidateUpstreamBooleanData(),t.parent.invalidateDownstreamBooleanData().recomputeBoolean()),j(t)&&(t.freeBooleanPointer(),n instanceof M&&n.invalidateDownstreamBooleanData().recomputeBoolean()),ve(t)&&t.detachShape(),this.disposeAndUnregisterEntityRecursivelyIfNotReregistered(t),this.pathConstraints.removeDependencies(t.uuid),t.updatePathSnapping()}else if(e.path.length===0&&e.type===9){let t=this.find(e.id);if(t===void 0)throw Error(`scene tree move: object ${e.id} not found`);this.markNeedsRecomputeInstancesForChildren(t);let n=t.parent;this.markNeedsRecomputeInstancesForAncessors(n),t.cloner?.resetOnMove(),this.markToExpandCloner(t);let r=e.parent===null?this:this.find(e.parent);if(r===void 0)throw Error(`scene tree move: new parent ${e.parent} not found for object ${e.id}`);r.add(t),this.markNeedsRecomputeInstancesForAncessors(r),this.markToExpandCloner(t),t.invalidateClonerTransform(t),t.updateVisible(this),t.resetBBoxNeedsUpdate(),this.markPenumbraSizeDirty();let i=e.localIndex;r.children.splice(i,0,r.children.pop()),j(t)&&(t.invalidateUpstreamBooleanData(),N(t.parent)?t.parent.invalidateDownstreamBooleanData().recomputeBoolean():n instanceof M&&n.invalidateDownstreamBooleanData().recomputeBoolean()),t.updatePathSnapping()}this.markNeedsUpdateRendererDirty(),this.markGeometryCacheDirty()}get playPage(){return this.find(this.data.publish.playPage)??this.errorPage}updatePage(e){this.shadowsDirty=!0,this.activePage&&this.activePage.onDeactive(),this.activePage=this.errorPage;for(let t of this.children)t instanceof I&&(t.visible=t.uuid===e,t.visible&&(this.activePage=t,this.activePage.onActive(this)));this.activePage!==this.splatViewer?.activePage&&this.reloadSplats()}updateEntityByOp(e,t,n,r){if(this.shadowsDirty=!0,t.type===0){if((`overrides`in t.props||`component`in t.props)&&this.markNeedsRecomputeInstances(),`visible`in t.props&&this.markPenumbraSizeDirty(),t.path.includes(`overrides`)&&`states`in t.props){let{rest:e}=t.props;t={...t,props:e},this.markNeedsRecomputeInstances()}t.path[0]===`pathSnapping`&&t.props.pathId!==void 0&&this.pathConstraints.setConstraint(e,t.props.pathId)}let i=this.find(e);if(i)try{(function(e,t,n,r){e.updateByOp(t,n,r,!1)})(i,t,n,{scene:this,shared:r}),i instanceof A&&i.updateGeometryGroupsIfNeeded()}catch(e){console.error(e)}}updateEntity2DByOp(e,t,n,r,i,a=[]){e.updateEntityByOp(t,n,r,i),this.traverseEntity(e=>{(T(e)||e instanceof I)&&(a.includes(e.frameId??``)||e.frameId===t)&&e.updateEntity2DByOp(t,n,r,i)})}get activeCamera(){return this.activePage.activeCamera}switchActiveCamera(e){this.activePage.switchActiveCamera(e)}isInvisibleObjects(e){return e===this.invisibleObjects||e.hasAnccestor(this.invisibleObjects)}init(e,t){let n=Object.entries(t.data.lib.components).map((e,t)=>({data:e[1].asset.data,children:e[1].asset.children,id:e[0],fi:t}));this.invisibleObjects.updateState(this.invisibleObjects.data,{scene:this,shared:t}),this.add(this.invisibleObjects),this.createChildrenObjects(n,this.invisibleObjects,t),this.createChildrenObjects(e.objects,this,t),this.updatePage(e.publish.playPage),this.activePage.switchToPlayCamera(),this.expandInstances(t,!0),this.traverseEntity(e=>{e instanceof F&&e.updateUp()}),this.doPendingExpandCloner({scene:this,shared:t}),this.applyPendingCommands()}markNeedsRecomputeInstances(){this.needsRecomputeInstances=!0}markNeedsRecomputeInstancesForChildren(e){e.traverseEntity(e=>{(e.data.type===`Component`||e.data.type===`Instance`)&&this.markNeedsRecomputeInstances()})}markNeedsRecomputeInstancesForAncessors(e){k.is(e)&&(e.data.type===`Component`&&this.markNeedsRecomputeInstances(),e.traverseAncestors(e=>{k.is(e)&&e.data.type===`Component`&&this.markNeedsRecomputeInstances()}))}relativeizeInner(e,t,n,r,i,a,o){if(e){let s=r.find(e);s&&s!==r&&i.forInstancesRec(r=>{r.data=pe(r.data,i=>{let s=i.events.data(o.id),c=r.goUp(a);if(c){let r=[...le(c.identity),e].join(`-`),i=this.entityIdentityToEntity[r];if(i){let e=i.uuid;me.zoom(s,t)[n]=e}else console.warn(`cannot find instance`)}}).data})}}rewriteActions(e,t,n,r,i,a){e.forEach(e=>{e.data.type===`Transition`||e.data.type===`Animation`&&e.data.object?this.relativeizeInner(e.data.object,[...t,e.id],`object`,n,r,i,a):e.data.type===`Conditional`&&(this.rewriteActions(e.data.ifActions,[...t,e.id,`ifActions`],n,r,i,a),this.rewriteActions(e.data.elseActions,[...t,e.id,`elseActions`],n,r,i,a))})}rewriteEventsBeforeGoToPlayMode(){this.traverseEntity(e=>{if(O(e)&&typeof e.identity==`string`&&e.data.type===`Component`)return e.traverseEntity((t,n)=>{t.data.events.forEach(r=>{if(r.data.type===`GameControl`){let i=!1;if(t.forInstancesRec(e=>{e.data=pe(e.data,t=>{e.isInstanceRoot||(t.events.delete(r.id),i=!0)}).data}),!1===i)for(let i of ue.list)this.rewriteActions(r.data.gameActions[i],[`gameActions`,i],e,t,n,r)}else r.data.type===`Conditional`?(r.data.condition.type===`Distance`?(this.relativeizeInner(r.data.condition.fromObject,[`condition`],`fromObject`,e,t,n,r),this.relativeizeInner(r.data.condition.toObject,[`condition`],`toObject`,e,t,n,r)):r.data.condition.type===`State`?this.relativeizeInner(r.data.condition.object,[`condition`],`object`,e,t,n,r):r.data.condition.type===`Comparison`&&(r.data.condition.lOperand.type===`Property`&&this.relativeizeInner(r.data.condition.lOperand.value[0],[`condition`,`lOperand`,`value`],0,e,t,n,r),r.data.condition.rOperand.type===`Property`&&this.relativeizeInner(r.data.condition.rOperand.value[0],[`condition`,`rOperand`,`value`],0,e,t,n,r)),this.rewriteActions(r.data.inActions,[`inActions`],e,t,n,r),this.rewriteActions(r.data.outActions,[`outActions`],e,t,n,r)):`actions`in r.data&&this.rewriteActions(r.data.actions,[`actions`],e,t,n,r)})}),!0})}expandInstances(e,t,n){let r=new Set;this.traverseEntity(i=>{if(O(i)&&i.isInstanceRoot)return i.expandInstanceChildren({scene:this,shared:e,pendingDeletes:r}),t||i.resetBBoxNeedsUpdate(),n&&i.traverseEntity(e=>{n.addClip(e)}),!0});for(let e of r)this.disposeAndUnregisterEntityRecursivelyIfNotReregistered(e),ze(e)}recomputeInstances(e,t){this.needsRecomputeInstances&&(this.needsRecomputeInstances=!1,this.traverseEntity(e=>{O(e)&&e.isInstanceRoot&&(e.component=void 0)}),this.expandInstances(e,!1,t))}disposeAndUnregisterEntityRecursivelyIfNotReregistered(e){e.traverseEntity(e=>{let t=typeof e.identity==`string`?e.identity:e.identity.join(`-`);this.entityIdentityToEntity[t]===e&&(delete this.entityByUuid[e.uuid],delete this.entityIdentityToEntity[t]),e.dispose()})}clearScene(){this._autoInstancing?.dispose(),this._autoInstancing=null,this.instanceGroupsDirty=!0;for(let e of this.children)k.is(e)&&e.disposeRecursively();this.children.length=0}resetAfterClear(e,t){this.init(e,t)}raycast(e){return this.raycast1(e,!1)}raycast1(e,t){let n=[],r=i=>{for(let a of i.children){let i=a.cloner;if(k.is(a)&&!a.raycastLock&&(a.visible||i?.object.data.visible))if(!0===t&&a.isInstanceRoot){let t=[];if(e.intersectObject(a,!0,t),t.length){let e=t[0];e.object=a,e.point.applyMatrix4(e.object.matrixWorld);let r=a.matrixWorld.clone().invert();e.point.applyMatrix4(r),n.push(e)}}else(j(a)||Ae(a)&&this.enableHelpers&&a.objectHelper.visible)&&(e.intersectObject(a,!1,n),Ie(a,e,n)),r(a)}};return r(this.activePage),n}raycastWithClones(e){let t=[],n=r=>{for(let i of r.children){let r=i.cloner;k.is(i)&&(i.visible||r?.object.data.visible)&&((j(i)||Ae(i)&&this.enableHelpers&&i.objectHelper.visible)&&(e.intersectObject(i,!1,t),Ie(i,e,t,!0)),n(i))}};return n(this),t}forEachEntity(e){for(let t of this.children)k.is(t)&&e(t)}traverseConcreteEntity(e){for(let t of this.children)k.is(t)&&t.isConcreteEntity&&t.traverseEntity(e)}traverseEntity(e){for(let t of this.children)k.is(t)&&t.traverseEntity(e)}updateFont(e,t){this.traverseEntity(n=>{if(n instanceof A&&n.data.type===`Mesh`&&(n.data.geometry.type===`TextGeometry`||n.data.geometry.type===`InputGeometry`)&&n.data.geometry.font===e){let r=n.geometry,i=n.data.geometry;r.updateFont(e,t).then(()=>{r.update(i,t);let e=n.invalidateDownstreamBooleanData();N(e)&&e.recomputeBoolean()})}})}traverseObject(e){for(let t of this.children)Ce.is(t)&&t.traverseObject(e)}traverseVisibleEntity(e){for(let t of this.children)k.is(t)&&t.visible&&t.traverseVisibleEntity(e)}dispose(){this.clearScene()}createChildrenObjects(e,t,n){let r=0;for(let i of e)this.createObject(i.id,i.data,i.children,t,r,n),r+=1}registerObjectCreatedInLegacy(e){this.entityByUuid[e.uuid]=e}unregisterObject(e){delete this.entityByUuid[e.uuid];for(let t of e.children)this.unregisterObject(t)}createObject(e,t,n,r,i,a){let o={scene:this,shared:a},s=dt(e,t,o);return D(s)&&this.shapeBlendIntances.push(s),E(s)&&this.hairInstances.push(s),s&&(this.entityByUuid[e]=s,r.add(s),r.children.splice(i,0,r.children.pop()),n.length>0&&(s.isInstanceRoot?console.error(`instance should not have children!`):this.createChildrenObjects(n,s,a)),s.updateState(t,o),s instanceof A&&s.updateGeometryGroupsIfNeeded(),s.updateVisible(this),s.cloner&&this.toExpandCloner.add(s),t.pathSnapping?.pathId&&this.pathConstraints.setConstraint(e,t.pathSnapping.pathId)),t.type===`Empty`&&t.animations&&s.traverseEntity(e=>{let t=e.dataPatched;if(e instanceof A&&t.bones&&t.boneInverses){let n=new p(t.bones.map(e=>this.find(e)),t.boneInverses.map(e=>new y().fromArray(e)));e.bind(n,e.bindMatrix)}else e.matrixAutoUpdate=!0}),s}getCenter(e){let t=[];for(let n=0,r=e.length;n<r;++n){let{id:r,recursive:i}=e[n],a=this.find(r),o=i?a.recursiveBBox:a.singleBBox;t.push(...o.vertices)}let n=new v;return n.setFromPoints(t),n.getCenter(gt),gt}copyMatrixWorld(e,t){if(e===null)return void t.identity();let n=this.find(e);n?(n.updateWorldMatrix(!0,!1),t.copy(n.matrixWorld)):t.identity()}copyParentMatrixWorld(e,t){if(e===null)return void t.identity();let n=this.find(e)?.parent;n?(n.updateWorldMatrix(!0,!1),t.copy(n.matrixWorld)):t.identity()}traverseMaterial(e){this.traverseEntity(t=>{if(t instanceof be)if(Array.isArray(t.material))for(let n=0;n<t.material.length;n++)we(t.material[n])&&e(t.material[n]);else we(t.material)&&e(t.material)})}updateViewPlaneSize(e,t,n=!1){this.traverseConcreteEntity(r=>{r instanceof F&&r.setViewplaneSize(e,t,n)})}initializeSplatViewer(){this.splatViewer=new mt({scene:this}),this.reloadSplats()}reloadSplats(){this.splatViewer?.loadSplat()}};export{ht as a,rt as i,He as n,Qe as r,_t as t};