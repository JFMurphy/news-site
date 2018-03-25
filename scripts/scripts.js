var g_rss_feed;

function parse_rss(rss_feed, sectionID, sectionHeader) {
    g_rss_feed = rss_feed;
    var imgURL;
    var itemTitle;
    var itemText;

    $('#main-container')
    .append($('<div id="' + sectionID + '" class="row">')
        .append('<h1>'+ sectionHeader));

    $(rss_feed).find('item').each(function() {
        imgURL = $(this).find('media\\:thumbnail').attr('url');
        itemTitle = $(this).find('title').text();
        itemText = $(this).find('description').text();
        itemLink = $(this).find('link').text();         // Link to the full article

        buildStory(sectionID, imgURL, itemTitle, itemText, itemLink);
    });
}

/* Contructs the individual story containers */
function buildStory(sectionID, imgURL, itemTitle, itemText, itemLink) {
    $('#'+ sectionID)
        .append($('<div class="story col-sm-3">')
            .append('<div class="story-img"><img src="' + imgURL + '">')
            .append($('<div class="story-text">')
                .append('<div class="story-title">'+itemTitle+'</div> <div class="story-desc">'+itemText+'</div>'))
            .append('<div class="story-more"><button type="button"' +
             'class="btn btn-info btn-lg" data-toggle="modal" data-target="#articleModal" '+
             'data-title="'+ itemTitle + '" data-link="' + itemLink + '" data-imgurl="'+ imgURL + '">Read More'));
}

/* On successful load of the rss feed, the parse_rss function will be
    run and will be passed the variable for the section ID and section title.*/
function loadNews(sectionID, sectionHeader) {
    $.ajax({
        type: "GET",
        url: "scripts/"+ sectionID + "_rss.php",
        dataType: "xml",
        cache: false,
        var1: sectionID,
        var2: sectionHeader,
        success: function(data) {
            parse_rss(data, this.var1, this.var2);
        }
    });
}

function getArticleContent(link) {
    $.ajax({
        type: "GET",
        url: "scripts/content.php?file="+link,
        datatype: "html",
        cache: false,
        success: parseArticle
    });
}

/*
* Finds all 'p' tags that don't have classes in the html and appends them to the modal body.
*/
function parseArticle(html_feed) {
    $('.modal-body').empty();
    $('.modal-body').append($(html_feed).find('.story-body__introduction').text());
    $(html_feed).find('p:not([class])').each(function() {
        // console.log($(this).text());
        $('.modal-body').append('<p>' + $(this).text());
    });
}

function search(searchTerm) {
    var temp = "\\b" + searchTerm + "\\b";
    var regexQuery = new RegExp(temp, "gi");
    var currentLine;
    sectionID = "search_results";

    $('#main-container').empty();
    $('#main-container')
        .append($('<div id="' + sectionID + '" class="row">')
            .append('<h1>Search Results'));

    $(g_rss_feed).find('item').each(function() {
        item = $(this);
        imgURL = $(this).find('media\\:thumbnail').attr('url');
        itemTitle = item.find('title').text();
        itemText = item.find('description').text();
        itemLink = item.find('link').text();

        searchData = itemTitle + " " + itemText;
        // console.log(searchData);

        //numFoundItems += searchData.search(regexQuery);
        if (searchData.search(regexQuery) >= 0) {
            buildStory(sectionID, imgURL, itemTitle, itemText, itemLink);
        }
    });
}

$(document).ready(function() {
    loadNews('top_stories', 'Top Stories');

    /* Click events */
    /*
    * Clicking different section tabs.
    * When anchor is clicked the href is used as a variable to identify the relevant section
    * and the text is stored in a variable to be used later for section headers.
    */
    $('a:not([class])').click(function() {
        var sectionID = $(this).attr("href").replace('#', '');  // Used as an id for different news sections
        var sectionHeader = $(this).text();                     //
        // console.log("ID: " + sectionID, " Header: " + sectionHeader);
        $('#main-container').empty();
        loadNews(sectionID, sectionHeader);
    });

    /*
    * Functionality for when a modal is activated.
    * Functionality includes:
    * Changing the title of the modal.
    * Adding an image to the top of the modal.
    * Adding a link to the source of the news content.
    * Adding the content of an article.
    */
    $('#articleModal').on('show.bs.modal', function(event) {
        var button = $(event.relatedTarget);
        var newsTitle = button.data('title');
        var newsLink = button.data('link');         // Example: http://www.bbc.co.uk/news/uk-politics-38258976
        var newsLinkShort = newsLink.substr(26);    // Example: uk-politics-38258976
        var imgURL = button.data('imgurl');

        // console.log(newsTitle);
        // console.log(newsLink);
        // console.log(imgURL);

        var modal = $(this);
        modal.find('.modal-title').text(newsTitle);
        modal.find('#img-header>img').attr('src', imgURL);
        modal.find('#source-footer').empty();
        modal.find('#source-footer').append('Source: <a href="' + newsLink + '">' + newsLink);
        getArticleContent(newsLinkShort);

    });

    /* Empties the modal content when the modal is closed. */
    $('#articleModal').on('hidden.bs.modal', function () {
        var modal = $(this);
        modal.find('.modal-body').text('...');
    });

    /* Perform search when button is clicked */
    $('#search-term-btn').click(function(event) {
        search($('#search-term').val());
    });

    /* Perform search when enter is pressed. */
    $('#search-term').keypress(function() {
        if(event.keyCode == 13)
            search($('#search-term').val());
    });

    /*Initialises popover that provides search guidance.*/
    $(function () {
        $('[data-toggle="popover"]').popover()
    });

    /* Search help */
    $('#search-help').attr('data-content', "To perform a search, type your query into the box on the left and click the search button or hit enter on your keyboard.");
});
