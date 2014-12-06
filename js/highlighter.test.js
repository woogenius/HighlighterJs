test("Add Class Test", function () {
	// Given
	var elDiv = document.querySelector('.temp');
	elDiv.classList.remove("temp");

	// When
	$$.addClass(elDiv, "temp");

	// Then
	equal($$.hasClass(elDiv, "temp"), 1);
});