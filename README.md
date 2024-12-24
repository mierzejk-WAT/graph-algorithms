The following two graph algorithms that exploit boolean formula minimization of [conjunctive normal form](https://en.wikipedia.org/wiki/Conjunctive_normal_form) (CNF) are implemented and hosted on GitHub Pages:
- [Determining prime implicant of a boolean function](https://mierzejk-wat.github.io/wak.htm).  
If an _adjacency matrix_ is created, namely the number of variables is equal to the number of clauses (the matrix is square) and every clause contains consecutive variable (sum with identity matrix, ie. ones on the main diagonal), minimal vertex stable sets are calculated with kernels highlighted in red, and a graph can be drawn.
- [Optimal graph vertex coloring](https://mierzejk-wat.github.io/index.htm); the graph is defined by its binary incidence matrix.

[The prime implicant](https://en.wikipedia.org/wiki/Implicant) of the CNF is calculated with the exhaustive search approach, there is no Quine-McCluskey algorithm implemented.
> Please be advised the user interface is in Polish, as the applications were designed to be teaching aid in classes taken in Polish language.

Tech stack (apps were created in `2014`):
- TypeScript
- declarative bindings with [Knockout.js](https://knockoutjs.com/)
- Bootstrap for responsive UI
- jQuery
- HTML5 / CSS3
- Visual Studio 2013

![Determining prime implicant](imgs/Adjacency%20Matrix.png)  
![Graph vertex coloring](imgs/Graph%20Colouring.png)
