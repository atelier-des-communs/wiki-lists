const del = require('del');

var items = ['dist/**', 'src/**/*.js.map', 'src/**/*.jsx.map'];

items.forEach(function(toDelete, index, array) {
	del([toDelete]).then(
		function(paths) {
			if(paths.length > 0)
				console.log(toDelete + ' successfully removed');
			else
				console.log('Error while deleting ' + toDelete + ' (empty?)');
		}
	)
});
