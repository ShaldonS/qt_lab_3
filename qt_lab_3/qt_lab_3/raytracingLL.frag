#version 430  
out vec4 FragColor; 
in vec3 interpolated_vertex;  
#define EPSILON 0.001
#define BIG 1000000.0
const int DIFFUSE = 1;
const int REFLECTION = 2;
const int REFRACTION = 3;

const int DIFFUSE_REFLECTION = 1;	//	пересечение с диффузным объектом
const int MIRROR_REFLECTION = 2;	// пересечение с зеркальным объектом


/*** DATA STRUCTURES ***/
struct Camera
{
	vec3 Position;
	vec3 View;
	vec3 Up;
	vec3 Side;
	// отношение сторон выходного изображения
	vec2 Scale;
};

struct Ray
{
	vec3 Origin;
	vec3 Direction;
};

struct Sphere
{
    vec3 Center;
    float Radius;
    int MaterialIdx;
};

struct Triangle
{
    vec3 v1;
    vec3 v2;
    vec3 v3;
    int MaterialIdx;
};

struct Light
{
	vec3 Position;
};

struct Material
{
    //diffuse color
	vec3 Color;
    // ambient, diffuse and specular coeffs
	vec4 LightCoeffs;
    // 0 - non-reflection, 1 - mirror
	float ReflectionCoef;
    float RefractionCoef;
    int MaterialType;
};

//пересечение
struct Intersection
{
	float Time;
	vec3 Point;
	vec3 Normal;
	vec3 Color;

	vec4 LightCoeffs;

	float ReflectionCoef;
	float RefractionCoef;
	int MaterialType;
};

struct TracingRay
{
	Ray ray; // луч
	float contribution;	// вклад луча в результирующий цвет
	int depth; // номер переотражения
};

Ray GenerateRay ( Camera uCamera )
{
    vec2 coords = interpolated_vertex.xy * uCamera.Scale;
    vec3 direction = uCamera.View + uCamera.Side * coords.x + uCamera.Up * coords.y;
    return Ray ( uCamera.Position, normalize(direction) );
}

Camera initializeDefaultCamera()
{
    //** CAMERA **//
	Camera camera;
	camera.Position = vec3(0.0, 0.0, -8);
	//camera.Position = vec3(0.0, 0.0, -7.999);
    camera.View = vec3(0.0, 0.0, 1.0);
    camera.Up = vec3(0.0, 1.0, 0.0);
    camera.Side = vec3(1.0, 0.0, 0.0);
    camera.Scale = vec2(1.0);
	return camera;
}

void initializeDefaultScene( out Triangle triangles[12],  out Sphere spheres[3])
{
	//left
	triangles[0].v1 = vec3(-5.0,-5.0,-8.1);
	triangles[0].v2 = vec3(-5.0, 5.0, 5.0);
	triangles[0].v3 = vec3(-5.0, 5.0,-8.1);
	triangles[0].MaterialIdx = 0;
	triangles[1].v1 = vec3(-5.0,-5.0,-8.1);
	triangles[1].v2 = vec3(-5.0,-5.0, 5.0);
	triangles[1].v3 = vec3(-5.0, 5.0, 5.0);
	triangles[1].MaterialIdx = 0;
	
	//back
	triangles[2].v1 = vec3(-5.0,-5.0, 5.0);
	triangles[2].v2 = vec3( 5.0,-5.0, 5.0);
	triangles[2].v3 = vec3(-5.0, 5.0, 5.0);
	triangles[2].MaterialIdx = 1;
	triangles[3].v1 = vec3( 5.0, 5.0, 5.0);
	triangles[3].v2 = vec3(-5.0, 5.0, 5.0);
	triangles[3].v3 = vec3( 5.0,-5.0, 5.0);
	triangles[3].MaterialIdx = 1;
	
	//right
	triangles[4].v1 = vec3(5.0, 5.0, 5.0);
	triangles[4].v2 = vec3(5.0, -5.0, 5.0);
	triangles[4].v3 = vec3(5.0, 5.0, -8.1);			
	triangles[4].MaterialIdx = 2;
	triangles[5].v1 = vec3(5.0, 5.0, -8.1);
	triangles[5].v2 = vec3(5.0, -5.0, 5.0);
	triangles[5].v3 = vec3(5.0, -5.0, -8.1);				
	triangles[5].MaterialIdx = 2;
	
	//bottom
	triangles[6].v1 = vec3(-5.0,-5.0, 5.0);
	triangles[6].v2 = vec3(-5.0,-5.0,-8.1);
	triangles[6].v3 = vec3( 5.0,-5.0, 5.0);
	triangles[6].MaterialIdx = 3;
	triangles[7].v1 = vec3(5.0, -5.0, -8.1);
	triangles[7].v2 = vec3(5.0,-5.0, 5.0);
	triangles[7].v3 = vec3(-5.0,-5.0,-8.1);
	triangles[7].MaterialIdx = 3;
	
	//up
	triangles[8].v1 = vec3(-5.0, 5.0,-8.1);
	triangles[8].v2 = vec3(-5.0, 5.0, 5.0);
	triangles[8].v3 = vec3( 5.0, 5.0, 5.0);
	triangles[8].MaterialIdx = 4;
	triangles[9].v1 = vec3(-5.0, 5.0, -8.1);
	triangles[9].v2 = vec3( 5.0, 5.0, 5.0);
	triangles[9].v3 = vec3(5.0, 5.0, -8.1);
	triangles[9].MaterialIdx = 4;

	//front
	triangles[10].v1 = vec3(-5.0,-5.0, -8.1);
	triangles[10].v2 = vec3( 5.0,-5.0, -8.1);
	triangles[10].v3 = vec3(-5.0, 5.0, -8.1);
	triangles[10].MaterialIdx = 5;
	triangles[11].v1 = vec3( 5.0, 5.0, -8.1);
	triangles[11].v2 = vec3(-5.0, 5.0, -8.1);
	triangles[11].v3 = vec3( 5.0,-5.0, -8.1);
	triangles[11].MaterialIdx = 5;
	
	//spheres
	spheres[0].Center = vec3(-2.0,-1.0,-1.0);
	spheres[0].Radius =  1.5;
	spheres[0].MaterialIdx = 0;
	spheres[1].Center = vec3(2.0,1.0,2.0);
	spheres[1].Radius = 1.0; 
	spheres[1].MaterialIdx = 0;
	spheres[2].Center = vec3(4.0, -4.5, -2.0);
	spheres[2].Radius = 0.5; 
	spheres[2].MaterialIdx = 0;
}

bool IntersectSphere ( Sphere sphere, Ray ray, float start, float final, out float time )
{
	ray.Origin -= sphere.Center;
	float A = dot ( ray.Direction, ray.Direction );
	float B = dot ( ray.Direction, ray.Origin );
	float C = dot ( ray.Origin, ray.Origin ) - sphere.Radius * sphere.Radius;
	float D = B * B - A * C;
	if ( D > 0.0 )
	{
		D = sqrt(D);
		//time = min(max(0, ( -B - D ) / A ), ( -B + D ) / A );
		float t1 = ( -B - D ) / A;
		float t2 = ( -B + D ) / A;
		if((t1 < 0) && (t2 < 0))
			return false;

		if(min(t1, t2) < 0)
		{
			time = max(t1,t2);
			return true;
		}
		time = min(t1, t2);
		return true;
	}
	return false;
}

bool IntersectTriangle (Ray ray, vec3 v1, vec3 v2, vec3 v3, out float time )
{
    // // Compute the intersection of ray with a triangle using geometric solution
	// Input: // points v0, v1, v2 are the triangle's vertices
	// rayOrig and rayDir are the ray's origin (point) and the ray's direction
	// Return: // return true is the ray intersects the triangle, false otherwise
	// bool intersectTriangle(point v0, point v1, point v2, point rayOrig, vector rayDir)
        // compute plane's normal vector
	time = -1;
    vec3 A = v2 - v1;
    vec3 B = v3 - v1;
    // no need to normalize vector
	vec3 N = cross(A, B);
    // // Step 1: finding P
	// // check if ray and plane are parallel ?
	float NdotRayDirection = dot(N, ray.Direction);
    if (abs(NdotRayDirection) < 0.001)
		return false;
    // they are parallel so they don't intersect !
	// compute d parameter using equation 2
	float d = dot(N, v1);
    // compute t (equation 3)
	float t = -(dot(N, ray.Origin) - d) / NdotRayDirection;
    // check if the triangle is in behind the ray
	if (t < 0)	
		return false;
    // the triangle is behind
	// compute the intersection point using equation 1
	vec3 P = ray.Origin + t * ray.Direction;
    // // Step 2: inside-outside test //
	vec3 C;
    // vector perpendicular to triangle's plane
	//edge 0
	vec3 edge1 = v2 - v1;
    vec3 VP1 = P - v1;
    C = cross(edge1, VP1);
    if (dot(N, C) < 0)
		return false;
    // P is on the right side
	// edge 1
	vec3 edge2 = v3 - v2;
    vec3 VP2 = P - v2;
    C = cross(edge2, VP2);
    if (dot(N, C) < 0)
		return false;
    // P is on the right side
	// edge 2
	vec3 edge3 = v1 - v3;
    vec3 VP3 = P - v3;
    C = cross(edge3, VP3);
    if (dot(N, C) < 0)
		return false;
    // P is on the right side;
	time = t;
    return true;
    // this ray hits the triangle
}


bool Raytrace ( Ray ray, Sphere spheres[3], Triangle triangles[12], Material materials[6], float start, float final, inout Intersection intersect )
{
	bool result = false;
	float test = start;
	intersect.Time = final;
	for(int i = 0; i < 3; i++)
	{
		Sphere sphere = spheres[i];
		if( (IntersectSphere(sphere, ray, start, final, test)) && (test < intersect.Time) )
		{
			intersect.Time = test;
			intersect.Point = ray.Origin + ray.Direction * test;
			intersect.Normal = normalize ( intersect.Point - spheres[i].Center );
			//intersect.Color = materials[3].Color;
			intersect.Color = vec3(1.5, 0, 1);
			//intersect.LightCoeffs = vec4(0.75, 0.75, 0.75, 2);
			//intersect.ReflectionCoef = 1.15;
			//intersect.RefractionCoef = 1;
			//intersect.MaterialType = MIRROR_REFLECTION;
			result = true;
		}
	}
	int idx;
	for(int i = 0; i < 12; i++)
	{
		Triangle triangle = triangles[i];
		if((IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test)) && (test < intersect.Time))
		{ 
			intersect.Time = test;
			intersect.Point = ray.Origin + ray.Direction * test;
			intersect.Normal = normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
			idx = triangle.MaterialIdx;
			intersect.Color = materials[idx].Color;
			//intersect.Color = vec3(1,0,0);
			intersect.LightCoeffs = vec4(0.9, 0.9, 0.9 , 512.0);
			//intersect.ReflectionCoef = 1.5;
			//intersect.RefractionCoef = 1.0;
			intersect.MaterialType = DIFFUSE_REFLECTION;
			result = true;
		}
	}
	return result;
}

void initializeDefaultLightMaterials(out Light light, out Material materials[6])
{
	//** LIGHT **//
	light.Position = vec3(0.0, 2.0, -4.0);
	//light.Position = vec3(0.0, 4.0, 0.0);
	/** MATERIALS **/
	vec4 lightCoefs = vec4(0.4, 0.9, 0.0, 512.0);

	//left
	materials[0].Color = vec3(1.0f, 0.5f, 0.31f); // red.x = 0.0; red.y = 1.0; red.z = 0.0
	materials[0].LightCoeffs = vec4(lightCoefs);
	materials[0].ReflectionCoef = 0.5;
	materials[0].RefractionCoef = 1.0;
	materials[0].MaterialType = DIFFUSE;
	
	//back
	materials[1].Color = vec3(0.99f, 0.5f, 0.3f);
	materials[1].LightCoeffs = vec4(lightCoefs);
	materials[1].ReflectionCoef = 0.5;
	materials[1].RefractionCoef = 1.0;
	materials[1].MaterialType = DIFFUSE;
	
	//right
	materials[2].Color = vec3(1.0f, 0.5f, 0.31f);
	materials[2].LightCoeffs = vec4(lightCoefs);
	materials[2].ReflectionCoef = 0.5;
	materials[2].RefractionCoef = 1.0;
	materials[2].MaterialType = MIRROR_REFLECTION;
	
	//bottom
	materials[3].Color = vec3(1.0f, 0.5f, 0.31f);
	materials[3].LightCoeffs = vec4(lightCoefs);
	materials[3].ReflectionCoef = 0.5;
	materials[3].RefractionCoef = 1.0;
	materials[3].MaterialType = MIRROR_REFLECTION;
	
	//up
	materials[4].Color = vec3(1.0f, 0.5f, 0.2f);
	materials[4].LightCoeffs = vec4(lightCoefs);
	materials[4].ReflectionCoef = 0.5;
	materials[4].RefractionCoef = 1.0;
	materials[4].MaterialType = DIFFUSE_REFLECTION;
	
	materials[5].Color = vec3(0, 1.0, 1.0);
	materials[5].LightCoeffs = vec4(lightCoefs);
	materials[5].ReflectionCoef = 0.5;
	materials[5].RefractionCoef = 1.0;
	materials[5].MaterialType = DIFFUSE_REFLECTION;

}
vec3 Phong ( Camera uCamera, Intersection intersect, Light currLight, float shadow)
{
	vec3 light = normalize ( currLight.Position - intersect.Point );
	float diffuse = max(dot(light, intersect.Normal), 0.0);
	vec3 view = normalize(uCamera.Position - intersect.Point);
	vec3 reflected = reflect( -view, intersect.Normal );
	float specular = pow(max(dot(reflected, light), 0.0), intersect.LightCoeffs.w);
	int Unit = 1; // яркость бликов
	return intersect.LightCoeffs.x * intersect.Color + 
		   intersect.LightCoeffs.y * diffuse * intersect.Color * shadow  + 
		   intersect.LightCoeffs.z * specular * Unit;
}

float Shadow(Light currLight, Intersection intersect, Sphere spheres[3], Triangle triangles[12], Material materials[6])
{
	float shadow = 1.0;
	vec3 direction = normalize(currLight.Position - intersect.Point);
	float distanceLight = distance(currLight.Position, intersect.Point);
	Ray shadowRay = Ray(intersect.Point + direction * EPSILON, direction);
	Intersection shadowIntersect;
	shadowIntersect.Time = BIG;
	if(Raytrace(shadowRay, spheres, triangles, materials, 0.0, distanceLight, shadowIntersect))
	{
		shadow = 0.0;
	}
	return shadow;
}

const int N = 12;
TracingRay t[N];
int counter = 0;
void pushRay(TracingRay el) // положить луч в стек
{
	if (counter < N) t[counter++] = el;
}
TracingRay popRay() // взять луч из стека
{
	int temp = counter;
	if (counter > 0) counter--; // если счетчик больше 0, то уменьшаем его на 1
	return t[counter];
}
bool isEmpty()	// проверка пустоты
{
	return counter == 0;
}



void main ( void ) 
{   
	float start = 0;
	float final = BIG;
	float contribution = 0.5;

	Triangle triangles[12];
	Sphere spheres[3];
	Light light;
	Material materials[6];
	vec3 resultColor = vec3(0,0,0);

	Camera uCamera = initializeDefaultCamera();
	Ray ray = GenerateRay( uCamera);
	TracingRay trRay = TracingRay(ray, 1, 0);

	initializeDefaultScene(triangles, spheres);
	initializeDefaultLightMaterials(light, materials);

	Intersection intersect;
	pushRay(trRay);

	while(!isEmpty())
	{
		TracingRay trRay = popRay();
		ray = trRay.ray;
		intersect.Time = BIG;
		start = 0;
		final = BIG;
		if (Raytrace(ray, spheres, triangles, materials, start, final, intersect))	// вычисление освещения
		{
			switch(intersect.MaterialType)
			{
			case DIFFUSE_REFLECTION:
			{
				float shadow = Shadow(light, intersect, spheres, triangles, materials); //в методичке неправильно
				resultColor += contribution * Phong (uCamera,intersect, light, shadow ); 
				break;
			}
			case MIRROR_REFLECTION:
			{
				if (intersect.ReflectionCoef < 1)
				{
					contribution = trRay.contribution * (1 - intersect.ReflectionCoef);
					//contribution *= intersect.ReflectionCoef;
					float shadow = Shadow(light, intersect, spheres, triangles, materials);
					resultColor += contribution * Phong (uCamera,intersect, light, shadow ); 
				}
				vec3 reflectDirection = reflect(ray.Direction, intersect.Normal);
				// создать луч отражения
				//contribution = trRay.contribution * intersect.ReflectionCoef;
				contribution *= intersect.ReflectionCoef;
				TracingRay reflectRay = TracingRay(Ray(intersect.Point + reflectDirection * EPSILON, reflectDirection),contribution, trRay.depth + 1);
				pushRay(reflectRay);
				break;
			}
			}
		}
	}
	FragColor = vec4 (resultColor, 1.0);
}