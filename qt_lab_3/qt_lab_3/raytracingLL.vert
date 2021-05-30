#version 430 
in vec3 vertex; //позиция вершины
out vec3 interpolated_vertex;  //сканированная

void main (void) 
{    
	gl_Position = vec4(vertex, 1.0);   
	interpolated_vertex = vertex; 
}



