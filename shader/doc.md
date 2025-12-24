
/**
https://mathworld.wolfram.com/topics/ComputationalGeometry.html
The texture channels iChannelN may be defined by inserting code of the following form at the top of your shader

#iChannel0 "file://duck.png"
#iChannel1 "https://66.media.tumblr.com/tumblr_mcmeonhR1e1ridypxo1_500.jpg"
#iChannel2 "file://other/shader.glsl"
#iChannel2 "self"
#iChannel4 "file://music/epic.mp3"
#iChannel0::MinFilter "NearestMipMapNearest"
#iChannel0::MagFilter "Nearest"
#iChannel0::WrapMode "Repeat"
bool isKeyPressed(int);
bool isKeyReleased(int);
bool isKeyDown(int);
bool isKeyToggled(int);

Additionally it will expose variables such as Key_A to Key_Z, Key_0 to Key_9, Key_UpArrow, Key_LeftArrow, Key_Shift, etc. Use these constants together with the functions mentioned above to query the state of a key.

#include "some/shared/code.glsl"
#include "other/local/shader_code.glsl"
#include "d:/some/global/code.glsl"


At the moment, iResolution, iGlobalTime (also as iTime), iTimeDelta, iFrame, iMouse, iMouseButton, iDate, iSampleRate, iChannelN with N in [0, 9] and iChannelResolution[] are available uniforms.


*/