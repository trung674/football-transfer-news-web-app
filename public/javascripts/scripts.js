
$(document).ready(function() {
  // Fancy animation
  $('.tweet-container').each(function(i) {
    $(this).delay(200).fadeIn(500);
  });

});

// When the user scrolls down, show toTop button
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
    if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
        document.getElementById("toTop").style.display = "block";
        document.getElementById("upB").style.display = "block";

    } else {
        document.getElementById("toTop").style.display = "none";
        document.getElementById("upB").style.display = "none";
    }
}

// When button is clicked, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

function scrollDown() {
    window.scrollBy(0, $(window).height());
}

function scrollUp() {
    window.scrollBy(0, -1 * $(window).height());
}
