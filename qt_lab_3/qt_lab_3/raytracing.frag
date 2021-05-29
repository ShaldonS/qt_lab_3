#version 430 core
#define EPSILON 0.001
#define BIG 1000000.0
//data structures
struct Camera
{
        vec3 position;
        vec3 view;
        vec3 up;
        vec3 side;
};

struct Ray
{
        vec3 origin;
        vec3 direction;
};

//geometry

//Чтобы передать массив сфер с хоста в шейдер необходимо и в шейдере, и в программе С++ создать структуру, описывающую сферу
struct Sphere
{
        vec3 center;
        float radius;
        vec3 color;
        int material_idx;
};

struct Material
{
        //ambient, diffuse and specular coeffs
        vec4 light_coeffs;
};

//intersection functions
//Создаём структуру для хранения пересечения
struct Intersection
{
        float time;
        vec3 point;
        vec3 normal;
        vec3 color;
        vec4 light_coeffs;
        int material_idx; //содержит индекс в массиве материалов
};

bool IntersectSphere(Sphere sphere, Ray ray, out float time)
{
        ray.origin -= sphere.center;
        float A = dot(ray.direction, ray.direction);
        float B = dot(ray.direction, ray.origin);
        float C = dot(ray.origin, ray.origin) - sphere.radius * sphere.radius;
        float D = B*B - A*C;
        if(D>0.0)
        {
          D = sqrt(D);
          //time = min ( max ( 0.0, ( -B - D ) / A ), ( -B + D ) / A )
          float t1=(-B-D)/A;
          float t2 =(-B+D)/A;
           if(t1 < 0 && t2 < 0)
           return false;
           if(min(t1, t2) < 0)   {
           time = max(t1,t2);
           return true;
           }
           time = min(t1, t2);
           return true;
           }
          return false;
}
//in, out, uniform variables
in vec3 interpolated_vertex;
out vec4 FragColor;

//юниформ для передачи переменных из хоста в любой шейдер
uniform Camera camera;//передаём координаты камеры
//отношение сторон выходного изображения
uniform vec2 scale;

// объявляем буфер
//Квалификатор, std430, указывает, что схема памяти блока должна соответствовать стандарту std430
//Второй квалификатор binding = 0 указывает, что блок должен быть связан с привязкой GL_SHADER_STORAGE_BUFFER с нулевым индексом
//Объявление блока интерфейса с помощью ключевого слова buffer указывает на то, что блок должен храниться в памяти и поддерживаться буферным объектом
layout(std430, binding=0) buffer SphereBuffer
{
        Sphere sphere_data[];//Теперь во всём фрагментном шейдере можно обращаться к массиву sphere_data.
};


//scene
//Sphere sphere = {vec3(-1.0, -1.0,-2.0), 2, vec3(1.0,1.0,2.0), 0};
Material material={vec4(0.4, 0.9, 0.0, 512.0)};//материал «по умолчанию»
vec3 light_pos = vec3(1,0,-8);//позицию источника освещения

//functions
Ray GenerateRay(Camera camera)
{
        vec2 coords=interpolated_vertex.xy * normalize(scale);//необходимо, чтобы изображение не деформировалось при изменении размеров окна
        vec3 direction=camera.view + camera.side*coords.x + camera.up*coords.y;
        return Ray(camera.position, normalize(direction));
}

//пересекает луч со всеми примитивами сцены и возвращает ближайшее пересечение
bool Intersect(Ray ray, float start, float final, inout Intersection intersect)
{
   bool result = false;
   float time = start;
   intersect.time = final;
   for(int i=0; i< sphere_data.length(); i++)
   {
     if(IntersectSphere(sphere_data[i], ray, time)&& time<intersect.time)
         {
           intersect.time = time;
           intersect.point= ray.origin+ ray.direction*time;
           intersect.normal = normalize(intersect.point - sphere_data[i].center);
           intersect.color= sphere_data[i].color;
           intersect.light_coeffs = material.light_coeffs;
           result = true;
         }
   }
   return result;
}

//
float Shadow(vec3 pos_light, Intersection intersect)
{
  float shadowing=1.0;//точка освещена
  vec3 direction= normalize(pos_light - intersect.point);//вектор к источнику света
  float distanceLight = distance(pos_light, intersect.point);//расстояние до источника света
  Ray shadowRay = Ray(intersect.point + direction * EPSILON, direction);//генерация теневого луча
  Intersection shadowIntersect;
  shadowIntersect.time = BIG;
  // trace ray from shadow ray begining to light source position
  if(Intersect(shadowRay, 0, distanceLight, shadowIntersect))
  {
   shadowing = 0.0;//этот источник света невидим в точке пересечения
  }
  return shadowing;
}


//освещение
//шейдинг (закрашивание) по Фонгу (формула)
vec3 Phong(Intersection intersect, vec3 pos_light, float shadow)
{
  vec3 light = normalize(pos_light - intersect.point);
  float diffuse = max(dot(light, intersect.normal), 0.0);
  vec3 view = normalize(camera.position - intersect.point);
  vec3 reflected = reflect(-view, intersect.normal);
  float specular = pow(max(dot(reflected, light), 0.0), intersect.light_coeffs.w);
  return intersect.light_coeffs.x * intersect.color+
         intersect.light_coeffs.y * diffuse*intersect.color * shadow+
                 intersect.light_coeffs.z * specular;
}

//трассирует луч
vec4 Raytrace(Ray primary_ray)
{
  vec4 resultcolor= vec4(0,0,0,0);
  Ray ray = primary_ray;
  Intersection intersect;
  intersect.time = BIG;
  float start =0 ;
  float final = BIG;
  if(Intersect(ray, start, final, intersect))
  {
   float shadowing = Shadow(light_pos, intersect);
   resultcolor += vec4(Phong(intersect, light_pos, shadowing), 0);
  }
  return resultcolor;
}


//записывает интерполированные координаты в выходной буфер цвета
void main(void)
{
 //FragColor = vec4(abs(interpolated_vertex.xy), 0, 1.0);
 Ray ray=GenerateRay(camera);
 FragColor = Raytrace(ray);
 //FragColor=vec4(abs(ray.direction.xy),0,1.0);//abs (модуль) применяется потому, что компонента цвета не может быть отрицательной, а наши интерполированные значения лежат в диапазоне от -1 до 1
 //FragColor=vec4(abs(camera.up),1.0);
}
