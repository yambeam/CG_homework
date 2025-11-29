#version 300 es
precision mediump float;

out vec4 FragColor;

uniform float ambientStrength, specularStrength, diffuseStrength,shininess;

in vec3 Normal;//法向量
in vec3 FragPos;//相机观察的片元位置
in vec2 TexCoord;//纹理坐标
in vec4 FragPosLightSpace;//光源观察的片元位置

uniform vec3 viewPos;//相机位置
uniform vec4 u_lightPosition; //光源位置	
uniform vec3 lightColor;//入射光颜色

uniform sampler2D diffuseTexture;
uniform sampler2D depthTexture;
uniform samplerCube cubeSampler;//盒子纹理采样器


float shadowCalculation(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir)
{
    
    float shadow = 0.0;  // 非阴影
    
    /*TODO3: 添加阴影计算，返回1表示是阴影，返回0表示非阴影*/
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5f + 0.5;
    // 光的视野下最近的深度
    float closetDepth = texture(depthTexture, projCoords.xy).r;
    // 当前片元的深度
    // float currentDepth = projCoords.z;
    // 阴影偏移，减轻漏光现象
    // k 取0.005的效果并不好，经测试改为0.001
    float bias = max(0.001 * (1.0 - dot(normal, lightDir)), 0.0001);
    // Extra PCF采样
    // 计算纹素大小
    vec2 texelSize = 1.0 / vec2(1024.0f, 1024.0f);
    // kernel_size = 7 -> 计算7*7范围内的所有阴影值求平均
    //性能开销较大，但是模型小无所谓
    for (int x = -3; x <= 3; ++x)
    {
        for (int y = -3; y <= 3; ++y)
        {
            float pcfDepth = texture(depthTexture, projCoords.xy + vec2(x, y) * texelSize).r;
            float currentDepth = projCoords.z - bias;
            shadow += currentDepth > pcfDepth ? 1.0f : 0.0f;
        }
    }
    return shadow / 49.0f;
    // Extra PCF采样
   
}       

void main()
{
    
    //采样纹理颜色
    vec3 TextureColor = texture(diffuseTexture, TexCoord).xyz;

    //计算光照颜色
 	vec3 norm = normalize(Normal);
	vec3 lightDir;
	if(u_lightPosition.w==1.0) 
        lightDir = normalize(u_lightPosition.xyz - FragPos);
	else lightDir = normalize(u_lightPosition.xyz);
	vec3 viewDir = normalize(viewPos - FragPos);
	vec3 halfDir = normalize(viewDir + lightDir);

    //环境光，漫反射光，镜面反射光
    /*TODO2:根据phong shading方法计算ambient,diffuse,specular*/
    vec3  ambient,diffuse,specular;

    ///////////////////////////////////////////////////////////////////////////////////////////////
    ambient = ambientStrength * lightColor;
    //环境光
    float diff = max(dot(norm, lightDir), 0.0);
    diffuse = diffuseStrength * diff * lightColor;
    //漫反射光
    vec3 reflectDir = reflect(-lightDir, norm); // 计算反射角
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    specular = specularStrength * spec * lightColor;
    //镜面反射光
    ///////////////////////////////////////////////////////////////////////////////////////////////


  	vec3 lightReflectColor=(ambient +diffuse + specular);

    //判定是否阴影，并对各种颜色进行混合
    float shadow = shadowCalculation(FragPosLightSpace, norm, lightDir);
    //vec3 resultColor =(ambient + (1.0-shadow) * (diffuse + specular))* TextureColor;
    vec3 resultColor=(1.0-shadow/2.0)* lightReflectColor * TextureColor;
    
    FragColor = vec4(resultColor, 1.f);
}


